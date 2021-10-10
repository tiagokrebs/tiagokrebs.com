---
title: "Clickhouse - Tutorial"
subtitle: "Como o Clickhouse adiciona seu próprio flavor de processamento de dados a arquitetura dos DBMS colunares."
description: "Um tutorial breve sobre Clickhouse, utilizando dataset contendo centenas de milhares de eventos, que apresenta a facilidade de uso da plataforma, seus conceitos básicos e ótimo desempenho no processamento de dados."
date: 2021-10-10
draft: false
showtoc: true
author: "Tiago Krebs"
thumbnail: "/images/post/clickhouse-tutorial/clickhouse_debug.jpg"
image: "/images/post/clickhouse-tutorial/clickhouse_debug.jpg"
tags: ["Clickhouse", "Tutorial", "Data Engining", "SQL"]
categories: ["Tech"]
---
[comment]: <> "LTeX: language=pt-BR"

Clickhouse é um banco de dados colunar criado por Alexey Milovidov na Yandex em 2009 com o objetivo de simplificar o processamento de dados interno da empresa. Em 2016 o projeto se tornou opensource e desde então vem ganhando cada vez mais notoriedade pela maturidade do código, ótimos resultados em benchmarks e visível preocupação com cada nanossegundo de processamento.  

Atualmente, apesar de contar com uma equipe relativamente pequena (15 desenvolvedores), já é utilizado em grandes empresas de tecnologia como Uber, Tesla e eBay ([veja a lista completa aqui](https://clickhouse.com/docs/en/introduction/adopters/)), além de possuir inúmeros cases de sucesso onde Petabytes de dados são processados diariamente. Devido ao seu sucesso, recentemente o projeto recebeu aporte de $50M e está em fase de transição da Yandex para um braço da companhia dedicado à plataforma, a Clickhouse Inc.

Há alguns meses tive a oportunidade de liderar um projeto na Azion Technologies, onde substituímos diversas plataformas dos nossos pipelines de dados por Clickhouse. Hoje ele é uma das principais ferramentas de consumo, processamento, transformação e storage de informações vindas de diferentes serviços da empresa. Através desse trabalho minha equipe entrega valor para outros squads e clientes na forma de eventos e métricas, utilizados para medir desempenho dos nossos produtos, geração de insights, monitoração e troubleshooting.
A simplicidade como a plataforma trata problemas complexos e a sua resiliência me tornaram, além de um sólido Kafka fan boy, agora um Clickhouse fan boy também.

Esse artigo traz uma breve descrição sobre bancos de dados colunares e como o Clickhouse adicionou o seu próprio flavor a arquitetura. Além disso, um tutorial breve, utilizando dataset contendo centenas de milhares de eventos, com a intenção de mostrar a facilidade de uso da plataforma e seus conceitos básicos. 

## Bancos de dados colunares
Bancos de dados colunares são conhecidos por implementar métodos mais precisos de busca e estão no mercado há muito tempo. Por definição, essa categoria de DBMS armazena os dados de tabelas em colunas no lugar de linhas. Considere que as tabelas de um banco de dados possuem duas dimensões, em um modelo de linhas podemos definir a seguinte tabela:

| row |timestamp | id | value |
|---|---|---|---|
| 1 | 2021-09-30 18:36:01 | 1239 | 8374.9 |
| 2 | 2021-09-30 18:37:43 | 8571 | 2457.8 |
| 3 | 2021-09-30 18:40:17 | 1239 | 2734.3 |
| 2 | 2021-09-30 18:45:00 | 2323 | 5657.8 |
| N | ... | ... | ... |

A mesma tabela em um banco de dados colunar pode ser representada da seguinte forma:
| row | 1 | 2 | 3 | 4 | N |
|---|---|---|---|---|---|
| timestamp | 2021-09-30 18:36:01 | 2021-09-30 18:37:43 | 2021-09-30 18:40:17 | 2021-09-30 18:45:00 | ... |
| id | 1239 | 8571 | 1239 | 2323 | ... |
| value | 8374.9 | 2457.8 | 2734.3 | 5657.8 | ... |

É comum olharmos para a estrutura acima e inferirmos que apenas a forma como os valores são organizados difere, porém, existe uma mudança sutil no mapeamento dos dados que altera a indexação completamente: em sistemas orientados a colunas as chaves primárias são os dados. Na minha melhor tentativa de explicar essa afirmação, considere o index abaixo em um sistema de linhas.

| row | id |
|---|---|
| 1 | 1239 |
| 2 | 8571 |
| 3 | 1239 |
| 2 | 2323 |
| N | ... |

Nesse caso o storage do index faz o mapeamento para cada linha da tabela original. A chave primária é `row` que está mapeada pelo dado indexado. Agora compare com o index abaixo, em um sistema colunar.

| row | 1,3 | 2 | 4 | N |
|---|---|---|---|---|
| id | 1239 | 8571 | 2323 | ... |

A chave primária é o dado, que está mapeado por `row`. Nesse sistema além dos valores serem armazenados em colunas, quando iguais também são compactados juntos. Note o index para o `id` `1239` do nosso exemplo, o mesmo valor é referenciado por apenas uma única coluna: `row` `1,3`. Uma das principais possibilidades que essa forma de mapeamento abre é a otimização de storage através de algoritmos modernos de compactação.

Devido as suas características, bancos de dados colunares são mais adequados para arquitetura OLAP com grande quantidade de consultas complexas e operações esparsas, ou seja, que não utilizam todos os campos das tabelas. Quando consideramos que, os casos onde todas as colunas de uma tabela precisam ser recuperados são raros, podemos dizer que esse é um trade-off aceitável. Ao mesmo tempo, em um modelo colunar inserções exigem transação e compactação por coluna. Essa necessidade pode trazer desempenho inferior que a arquitetura OLTP, quando todos os campos são informados. Entretanto, essa categoria de operação não afeta a ingestão de dados no Clickhouse, visto que não há controle de transação.

Em resumo, apesar de não ser totalmente verdadeiro, podemos dizer que, na prática, bancos de dados colunares são mais adequados para trabalho com OLAP enquanto bancos de dados orientados a linhas tem melhor afinidade com operações OLTP. Quanto ao Clickhouse também podemos concluir que o sistema faz uso total das vantagens de uma arquitetura OLAP, enquanto resolve algumas limitações do modelo.

Esses são alguns exemplos de DBMS colunares (de verdade) disponíveis hoje no mercado: AWS Redshift, Vertica, InfiniDB, SAP HANA, Google BigQuery e Druid.

## Clickhouse twist
> Minha equipe e eu enfrentamos vários desafios de processamento de dados que frequentemente exigiam estruturas de dados personalizadas e algoritmos sofisticados, soluções criativas e trade-offs, profundo conhecimento da área de domínio, hardware e matemática. Eu adoro dados e processamento em restrições extremas, onde você tem que pensar em bytes e nanossegundos para economizar petabytes e segundos. 
A equipe do ClickHouse compartilha essa paixão, na minha opinião, esta é a principal razão do sucesso do ClickHouse. - Alexey Milovidov, líder técnico do projeto.

Além de herdar a genética dos DBMS colunares o Clickhouse possui engines dedicadas a facilitar o processamento de dados de forma distribuída, ao mesmo tempo que provê alta disponibilidade. Também há integração de origens externas com diversas ferramentas de mercado através de foreign tables e processamento orientado a table functions. Essas características adicionam uma camada de abstração e facilidade ao dia a dia do engenheiro de dados, que pode reunir, combinar e processar informações de diversos sources sem precisar se preocupar com um grande conjunto de ferramentas e processos.

As features mais importantes do Clickhouse estão vinculadas a família Merge Three, engine que define a inserção e storage, e portanto, responsável direta pelo desempenho de escrita, transformação e leitura dos dados. Em resumo, a Merge Three foi criada para suportar uma grande quantidade de inserções nas tabelas. Os dados são escritos em *parts*, após regras são aplicadas para realizar o *merge* das *parts* em background. O método é muito mais eficiente do que a escrita constante do dado no storage durante o insert. Essa operação abre possibilidade para as principais features da engine.

- **Storage ordenado por chave primária**: permite a criação de índices esparsos para melhorar o desempenho das queries.
- **Chave de particionamento**: operações diretamente com o particionamento são mais eficientes que operações comuns, a *partition key* é utilizada como ponto de corte das queries, promovendo mais desempenho.
- **Replicação**: habilita replicação de tabelas entre nodos do mesmo cluster ou até mesmo localmente entre diferentes discos.
- **Sampling**: se necessário é possível definir o método de sampling para as queries na tabela.
- **Agregação**: é facilitada com base em regras na tabela, permitindo que sejam aplicadas diretamente pela engine após a operação de insert.
- **Tempo de vida**: é possível definir o TTL para tabelas e/ou colunas, as ações de deleção ou movimentação dos dados são feitas pela engine com base nas regras.
- **Storage em múltiplos dispositivos**: através de políticas de storage é possível criar regras para utilização de discos e volumes específicos conforme a tabela (arquitetura hot/warm/cold). Além disso, Block Storages externos são extendidos como discos pelas policies, abrindo a possibilidade de integração transparente com S3 e HDFS.  

Essas características estão disponíveis através de diferentes engines que compõem a família Merge Three e podem ser combinadas entre si. Alguns exemplos são: `MergeTree`, `SummingMergeTree`, `ReplacingMergeTree`, `AggregatingMergeTree`, `CollapsingMergeTree`, `VersionedCollapsingMergeTree` e`GraphiteMergeTree`. Para cada uma dessas engines ainda é possível adicionar a característica de replicação concatenando `Replicated*` ao nome, como `ReplicatedAggregatingMergeTree`.

## Tutorial
Neste tutorial vamos criar um nodo Clickhouse Standalone. Após, utizamos o dataset [StackSample: 10% of Stack Overflow Q&A](https://www.kaggle.com/stackoverflow/stacksample) a fim de demonstrar algumas das funcionalidades do banco de dados.

### Install Clickhouse
Os pacotes de instalação do Clickhouse estão disponíveis para os principais gerenciadores e distribuições, três são necessários: `clickhouse-common`, `clickhouse-server` e `clickhouse-client`. Escolha o seu favorito, instale utilizando yum, dnf, apt, através de scripts disponibilizados pela comunidade ou compile a aplicação você mesmo. Para mais detalhes sobre o processo de instalação veja [a documentação oficial](https://clickhouse.com/docs/en/getting-started/install/).

Aqui vamos utilizar Docker Compose. Edite o arquivo `docker-compose.yaml` conforme abaixo.
```
version: "3"
services:

  clickhouse-client:
    container_name: "clickhouse-client"
    image: yandex/clickhouse-client
    command: ['--host', 'clickhouse-standalone']

  clickhouse-standalone:
    container_name: "clickhouse-standalone"
    image: yandex/clickhouse-server
    ports:
      - 8123:8123
      - 9000:9000
    volumes:
      - "./data/:/data"
    hostname: "clickhouse-standalone"
```

Inicie o ambiente.
```
$ docker-compose up -d
```

Apenas o container `clickhouse-standalone` deve estar Up. Não se preocupe com o `clickhouse-client` por enquanto.

### Dataset
Vamos utilizar o dataset [StackSample: 10% of Stack Overflow Q&A](https://www.kaggle.com/stackoverflow/stacksample) disponibilizado no Kaggle. O conjunto de dados possui uma amostra de perguntas e respostas do site entre 2008 e 2016. Se você quiser conhecer mais sobre os data dumps disponibilizados pela Stack Exchange vá até [data.stackexchange.com](https://data.stackexchange.com/) e [archive.org/details/stackexchange](https://archive.org/details/stackexchange).

Faça o download do dataset e descompacte na pasta `data` do seu local.
```
$ mkdir data
$ mv ~/Downloads/archive.zip data/
$ unzip data/archive.zip -d data/
```

### Tabelas
Para criar as tabelas, abra o CLI do Clickhouse.
```
$ docker exec -it clickhouse-standalone clickhouse-client --host clickhouse-standalone --multiquery

ClickHouse client version 21.9.3.30 (official build).
Connecting to clickhouse-standalone:9000 as user default.
Connected to ClickHouse server version 21.9.3 revision 54449.

clickhouse-standalone :)
```
A engine SQL da plataforma contempla todas as principais características esperadas como operadores, funções, dicionários, types, views, objetos materializados e compatibilidade com ANSI SQL. A documentação oficial sobre o dialeto SQL do Clickhouse pode ser encontrada [aqui](https://clickhouse.com/docs/en/sql-reference/syntax/).

Inicie criando a database para o tutorial.
```
CREATE DATABASE IF NOT EXISTS tutorial;
```

Então crie as tabelas que receberão os dados do dataset.
```
CREATE TABLE tutorial.tags
(
    Id UInt32,
    Tag String
)
ENGINE = MergeTree()
ORDER BY (Id, Tag);

CREATE TABLE tutorial.answers
(
    Id UInt32,
    OwnerUserId String,
    CreationDate DateTime,
    ParentId String,
    Score Int32,
    Body String
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(CreationDate)
ORDER BY (ParentId, CreationDate);

CREATE TABLE tutorial.questions
(
    Id UInt32,
    OwnerUserId String,
    CreationDate DateTime,
    ClosedDate Nullable(DateTime),
    Score Int32,
    Title String,
    Body String
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(CreationDate)
ORDER BY (OwnerUserId, CreationDate);
```

Experimente utilizar a instrução [SHOW](https://clickhouse.com/docs/en/sql-reference/statements/grant/#grant-show) para visualiar o objetos que acabamos de criar.

### Importação dos dados
A interface de entrada e saída do Clickhouse é bastante completa e possui integração com diversos formatos de dados. Através da engine SQL é possível definir o formato para `INPUT` e `OUTPUT` além da origem e/ou destino das informações. Com isso, importar, exportar ou até mesmo converter datasets em formatos como TSV, CSV, XML, JSON, TSKV, etc são operações que podem ser abstraídas facilmente pela plataforma. Veja mais em [Formats for Input and Output Data](https://clickhouse.com/docs/en/interfaces/formats/).

O dataset do tutorial é composto por três arquivos CSV, para importá-los utilize as instruções abaixo.

Abra uma sessão bash com o Clickhouse Standalome.
```
$ docker exec -it clickhouse-standalone bash
```

Importe `Tag.csv`.
```
$ cat /data/Tags.csv \
    | /usr/bin/clickhouse --client \
    --query="INSERT INTO tutorial.tags FORMAT CSVWithNames"
```

Importe `Answers.csv`. Note que, diferente do exemplo acima, nessa etapa estamos selecionando colunas específicas do CSV e ajustando o formado esperado para o campo `CreationDate` através da função `parseDateTimeBestEffort`. 
```
$ cat /data/Answers.csv \
    | /usr/bin/clickhouse --client \
    --query="INSERT INTO tutorial.answers SELECT Id UInt32, OwnerUserId, toDateTime(parseDateTimeBestEffort(CreationDate)) AS CreationDate, ParentId, Score, Body FROM input('Id UInt32, OwnerUserId String, CreationDate String, ParentId String, Score Int32, Body String') FORMAT CSVWithNames"
```

Importe `Questions.csv`. Para essa tabela, além do ajuste de valor para algumas colunas, utilizamos a opção `input_format_allow_errors_ratio` a fim de configurar um percentual de erros de importação aceitável para o procedimento (linhas mal formadas são descartadas).
```
$ cat /data/Questions.csv \
    sed "s/'/ /g" | /usr/bin/clickhouse \
    --client --query="INSERT INTO tutorial.questions SELECT Id UInt32, OwnerUserId, toDateTime(parseDateTimeBestEffort(CreationDate)) AS CreationDate, toDateTime(parseDateTimeBestEffort(replaceOne(ClosedDate, 'NA', null))) AS ClosedDate, Score, Title, Body FROM input('Id UInt32, OwnerUserId String, CreationDate String, ClosedDate String, Score Int32, Title String, Body String') FORMAT CSVWithNames" \
    --input_format_allow_errors_ratio=0.5
```
Encerre a sessão bash com `clickhosue-standalone`.

### Queries

Como vimos anteriormente, tabelas da família MergeTree fazem *merge* das *parts* quando necessário. Nós podemos forçar essa operação realizando o `OPTIMIZE` das tabelas agora, no lugar de esperar a engine decidir o melhor momento.

Abra o CLI do Clickhouse Standalone novamente e execute as queries abaixo.
```
OPTIMIZE TABLE tutorial.tags FINAL;
OPTIMIZE TABLE tutorial.answers FINAL;
OPTIMIZE TABLE tutorial.questions FINAL;
```

Selecione alguns registros das Tags.
```
clickhouse-standalone :) SELECT * FROM tutorial.tags LIMIT 5;

SELECT *
FROM tutorial.tags
LIMIT 5

Query id: 90752735-6cce-4220-92ce-ff61d6d4eb6c

┌─Id─┬─Tag───────────────────┐
│ 80 │ actionscript-3        │
│ 80 │ air                   │
│ 80 │ flex                  │
│ 90 │ branch                │
│ 90 │ branching-and-merging │
└────┴───────────────────────┘

5 rows in set. Elapsed: 0.004 sec. 

```

Obtenha o menor e maior score das respostas de todo o período.
```
clickhouse-standalone :) SELECT min(Score) AS min, max(Score) AS max FROM answers;

SELECT
    min(Score) AS min,
    max(Score) AS max
FROM answers

Query id: 7c8f3422-8ed9-4090-ac18-9085f8cbc7b1

┌─min─┬──max─┐
│ -42 │ 5718 │
└─────┴──────┘

1 rows in set. Elapsed: 0.010 sec. Processed 2.01 million rows, 8.06 MB (192.16 million rows/s., 768.64 MB/s.)
```

Obtenha quantas perguntas contém a string `pyhton` em cada ano.
```
clickhouse-standalone :) SELECT toYear(CreationDate) AS year, count() FROM questions WHERE Body ilike('%python%') GROUP BY year ORDER BY year;

SELECT
    toYear(CreationDate) AS year,
    count()
FROM questions
WHERE Body ILIKE '%python%'
GROUP BY year
ORDER BY year ASC

Query id: 3aa8083a-cd49-40ae-8149-1d8ec42bccfb

┌─year─┬─count()─┐
│ 2008 │     388 │
│ 2009 │    2180 │
│ 2010 │    4036 │
│ 2011 │    6284 │
│ 2012 │    9158 │
│ 2013 │   12914 │
│ 2014 │   14666 │
│ 2015 │   17538 │
│ 2016 │    9058 │
└──────┴─────────┘

9 rows in set. Elapsed: 0.868 sec. Processed 2.31 million rows, 3.25 GB (2.67 million rows/s., 3.75 GB/s.)
```

That's it. Esse tutorial e outros exemplos podem ser encontrados em [github.com/tiagokrebs/clickhouse-lab](https://github.com/tiagokrebs/clickhouse-lab).

## Cases de sucesso
- Cloudflare, [HTTP Analytics for 6M requests per second using ClickHouse](https://blog.cloudflare.com/http-analytics-for-6m-requests-per-second-using-clickhouse/)
- Uber, [Fast, Scalable and Reliable Logging at Uber with Clickhouse](https://presentations.clickhouse.com/meetup40/uber.pdf)
- eBay, [Our Online Analytical Processing Journey with ClickHouse on Kubernetes](https://tech.ebayinc.com/engineering/ou-online-analytical-processing/)
- Spotify, [Using ClickHouse for Experimentation](https://www.slideshare.net/glebus/using-clickhouse-for-experimentation-104247173)

## Referências
[Introducing ClickHouse, Inc.](https://clickhouse.com/blog/en/2021/clickhouse-inc/)  
[ClickHouse, Inc. Announces Incorporation, Along With $50M In Series A Funding](https://www.businesswire.com/news/home/20210920005219/en/ClickHouse-Inc.-Announces-Incorporation-Along-With-50M-In-Series-A-Funding)  
[Yandex Spins Off ClickHouse into Standalone Company](https://yandex.com/company/press_center/press_releases/2021/2021-09-20)  
[Everything You Always Wanted To Know
About GitHub](https://ghe.clickhouse.tech/#let-s-play-with-the-data)  
[Clickhouse Documentation](https://clickhouse.com/docs/en/)  
[Stack Exchange Data Explorer](https://data.stackexchange.com/)  
[Stack Exchange Data Dump](https://archive.org/details/stackexchange)  

---------------------------