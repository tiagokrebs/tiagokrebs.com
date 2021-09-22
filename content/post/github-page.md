---
title: "Como Criar um Blog Pessoal com Github Pages e Hugo"
subtitle: "Escreva posts com Markdown, utilize controle de versão e não pague nada pelo hosting"
description: ""
date: 2021-09-21
draft: false
showtoc: true
author: "Tiago Krebs"
image: "images/post/github-page/mohammad-rahmani-EZrVFJUysLk-unsplash.jpg"
tags: ["Github Pages", "Hugo", "Blog"]
categories: ["Tech"]
---

Seu Tech Blog também está num post-it perdido pela sua parede já faz um tempo?  

Resista aos seus instintos de Dev, não inicie um "projeto simples" utilizando sua linguagem e framework favoritos, com um sistema de comentários, test coverage, CI/CD e aquele Cloud Provider no qual você abriu conta mas nunca utilizou de verdade ($$$). *Hear me out*, crie seu site pessoal sem ficar preso a um serviço de hosting. Esse artigo descreve como utilizar Github Pages e Hugo para criar, manter e fazer o hosting de maneira fácil e o melhor de tudo, **Free**.

## Github Pages
O Github Pages é a combinação entre um repositório e um site estático. Para que o conteúdo do seu site seja publicado basta fazer um commit no branch `main` do repositório. Se quiser um overview rápido confira o [Github Pages Get Started](https://pages.github.com/). Aqui vamos dois repositórios, o primeiro destinado ao desenvolvimento e outro para a página gerada com o Hugo.

Criar repositórios no Github é fácil, mas, para que seu repositório funcione com o Github Pages, é necessário ter atenção ao nome escolhido. O repositório precisa ser nomeado da seguinte forma: `<github-user>.github.io`. Por exemplo, o repositório desta página é `tiagokrebs.github.io`. O nome do seu repositório também será a URL da sua página quando publicada.


Inicie criando dois repositórios:
- `<github-user>.github.io` Página publicada
- `<github-user>.github.io.dev` Repositório de desenvolvimento

## Hugo
O Hugo é um gerador de sites estáticos open source sofisticado e simples de utilizar. Com base em um template pré-definido (também chamado de tema ou skin) é capaz de interpretar como um website deve ser criado. Um tema é a combinação de HTML, CSS e outras estruturas que a Engine utiliza, como templates parciais, archetypes e layouts. O Hugo também possui um Web Server interno que pode ser utilizado em desenvolvimento para preview do conteúdo.

Existem duas formas de trabalho com o Hugo:
- Desenvolvimento: o conteúdo do site é criado utilizando Markdown, toda alteração é refletida na no Web Server interno imediatamente.
- Build: com base no layout do tema o Hugo gera o conteúdo completo do site, incluindo HTML, CSS, estáticos e o conteúdo das páginas escritas em Markdown.

### Instalando o Hugo
Instalar o Hugo é simples, veja em [Install Hugo](https://gohugo.io/getting-started/installing/).
- No Mac, `brew install hugo`
- No Linux, `snap install hugo`
- Também é possível utilizá-lo com [Docker](https://hub.docker.com/r/klakegg/hugo/).

## Criando o ambiente de desenvolvimento
Clone o repositório de desenvolvimento.
```
git clone git@github.com:<github-user>/<github-user>.github.io.dev.git
```

### Criando o site
Crie a estrutura inicial do site utilizando o CLI do Hugo.
```
hugo new site <github-user>.github.io.dev

cd <github-user>.github.io.dev
```
A seguinte estrutura será criada:
```
.
├── archetypes
├── config.toml
├── content
├── data
├── layouts
├── resources
├── static
|── themes
```
Inicialmente, apenas alguns diretórios e arquivos nos interessam:
- `content` - Diretório do conteúdo do site, diversos subdiretórios e arquivos Markdown
- `static` - Conteúdo estático, como imagens
- `themes` - Submódulo Git com o repositório do tema
- `config.toml` - Configuração básica do site
- `archetypes` - Templates utilizados pelo CLI na criação de arquivos Markdown

### Instalando o tema
O próximo passo é escolher um tema. Vá para a [página de temas do Hugo](https://themes.gohugo.io/) e escolha um. Atualmente eu estou usando o tema [Clean White](https://themes.gohugo.io/themes/hugo-theme-cleanwhite/). Uma vez escolhido basta adicionar o repositório do tema como um submódulo Git.
```
git submodule add <theme-github-url> <target-directory>
```
Para o tema Clean White:
```
git submodule add git@github.com:youngkin/hugo-theme-cleanwhite-rsy themes/hugo-theme-cleanwhite
```
O tema é criado como um subdiretório da pasta `themes`.
```
[...]
└── themes
    └── hugo-theme-cleanwhite
```

Algumas configurações padrão também foram inicializadas no arquivo `config.toml`. Adicione o tema utilizado. O nome do tema é o nome do diretório criado na pasta `themes`.
```
echo 'theme = "hugo-theme-cleanwhite"' >> config.toml
```

### Testando o site localmente
Para testar o site localmente crie a primeira página de teste.
```
hugo new post/testpage.md
```
Uma nova página será criada em `content/post/testpage.md`. A pasta `content` é utilizada pelo Hugo como uma das origens para a criação do site. O arquivo terá o seguinte conteúdo:
```
---
title: "Testpage"
date: 2020-08-27T13:43:09-06:00
draft: true
---
```
Note que o arquivo foi criado com base em `archetypes/default.md`. O conteúdo entre `---` é chamado de front matter e contém as configurações do Markdown. Abaixo desse bloco fica o corpo da página.

O próximo passo é testar a instalação iniciando o servidor interno do Hugo e acessando o site de desenvolvimento.
```
hugo server -D
```
Acesse [http://localhost:1313/](http://localhost:1313/) e veja seu site. Experimente alterar o título da página no arquivo `testpage.md`, o Hugo vai atualizar o seu site e recarregar no seu navegador assim que você salvar a alteração.

## Criando seu primeiro artigo
Comece removendo a página de teste, basta deletar o arquivo `content/post/testpage.md`.

### Configuração
A configuração básica do Hugo fica no arquivo `config.toml`, para mais detalhes veja em [Configure Hugo](https://gohugo.io/getting-started/configuration/).

```
baseurl = "https://tiagokrebs.github.io"
title = "Tiago Krebs"
theme = "hugo-theme-cleanwhite"
languageCode = "pt-br"
paginate = 5000 #frontpage pagination

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true

[params]
  header_image = ""
  title = "Software Engineering"
  slogan = "$ echo -e \"things I'm working on or pondering\"."
  SEOTitle = "Tiago Krebs Blog"
  keyword = "Tiago, Krebs, Docker, Kubernetes, Go, Golang, Microservice, Kafka, Flink, Clilckhouse, Data, Science, Micromaster, Azion, Edge, Computing"
 
  # Sidebar settings
  sidebar_about_description = "Systems Engineer, Software Developer, Data Engineer, Tech Manager"
  sidebar_avatar = ""
  about_me = true

  featured_tags = true 
  featured_condition_size = 2 # How many posts have to have a given tag to be featured (greater-than)

  image_404 = "images/404.jpg"
  title_404 = "Oops..."

  omit_categories = false

  [[params.addtional_menus]]
  title =  "ABOUT"
  href =  "/top/about/"

  [params.social]
  rss            = true
  email          = "krebstiago@gmail.com"
  linkedin       = "https://www.linkedin.com/in/tiagokrebs"
  github         = "https://github.com/tiagokrebs"
```

### Archetypes
Archetypes são templates usados pelo Hugo quando novas páginas são criadas através do CLI. Essa é a forma para a criação de um front matter padrão de acordo com o diretório. Eles descrevem características básicas das páginas como título, descrição, autor, data e se um TOC deve ser criado no topo ou não.
O Hugo cria um archetype default no arquivo `archetypes/default.md`. Crie um novo archetype em `archetypes/post.md`, destinado aos posts.

```
---
title: "{{ replace .Name "-" " " | title }}"
#description: <descrição aqui>
date: {{ .Date }}
draft: true
showtoc: true
image: ""
tags: []
categories: []
---

# Descrição aqui...
<--more-->
```

Existem outros archetypes importantes para o Hugo, leia mais em [Archetypes](https://gohugo.io/content-management/archetypes/).

Crie o primeiro post novamente e confira o arquivo Markdown gerado. Verifique se o archetype `post.md` foi aplicado com sucesso. 
```
hugo new post/testpage.md
```

### Escrevendo
Como dito anteriormente, as páginas são escritas utilizando Markdown. É provável que em algum momento você precise adicionar conteúdo estático a sua página, para isso utilize a pasta `static` criada pelo Hugo. Note que na referência dos estáticos o path `static` não precisa ser informado. Por exemplo, para utilizar a imagem `image_404 = "images/404.jpg"` no arquivo `config.toml` basta posicionar o arquivo `404.jpg` no path `static/images/` do seu projeto. 

### Conectando o repositório de desenvolvimento e o repositório do Github Pages
Essa etapa só precisa ser feita uma única vez. Agora é a hora de conectar o repositório de desenvolvimento com o repositório do Github Pages. Para isso vamos utilizar a pasta `public`. Esse é o diretório onde o Hugo cria o site no momento do build. Para fazer o link utilizamos um submódulo Git.
```
git submodule add -b main git@github.com:<github-user>/<github-user>.github.io.git public
```

Para verificar se o link foi criado corretamente utilize `git remote -v` dentro da pasta `public`.
```
$ cd public
$ git remote -v
origin	git@github.com:<github-user>/<github-user>/<github-user>.github.io.git (fetch)
origin	git@github.com:<github-user>/<github-user>/<github-user>.github.io.git (push)
$ cd ..
```

### Publicando o site
Para publicar o site siga os passos abaixo. Alguns deles precisam ser feitos apenas uma vez, após vamos criar o script `deploy.sh` para facilitar o trabalho.

Faça o build do site.
```
$ hugo -D

start building sites … 

                   | EN  
-------------------+-----
  Pages            | 18  
  Paginator pages  |  0  
  Non-page files   |  0  
  Static files     | 57  
  Processed images |  0  
  Aliases          |  5  
  Sitemaps         |  1  
  Cleaned          |  0  

Total in 33 ms
```

Faça o commit das alterações para o repositório do Github Pages.
```
cd public
git add .
git commit -m "primeiro commit"
git branch -M main
git push -u origin main
```

Faça o commit das alterações do repositório de desenvolvimento.
```
cd ..
cd public
git add .
git commit -m "primeiro commit"
git branch -M main
git push -u origin main
```

Para os próximos deploys você pode utilizar o script abaixo, posicione-o na raiz do seu repositório de desenvolvimento.
```
#!/bin/sh

# If a command fails then the deploy stops
set -e

printf "\033[0;32mDeploying updates to GitHub...\033[0m\n"

# Create commit message
msg="rebuilding site $(date)"
if [ -n "$*" ]; then
	msg="$*"
fi

# Build the project.
echo ""
echo ""
echo "Committing changes to $(pwd)"
hugo -D

# Go To Public folder
cd public

# Add 'public' (Github Pages repo) changes to git and commit/push.
echo ""
echo ""
echo "Committing changes to $(pwd)"
git add .
git commit -m "$msg"
git push origin main

# Add this repos changes to git and commit/push. First 'cd' out of public
cd ..
echo ""
echo ""
echo "Committing changes to $(pwd)"
git add .
git commit -m "$msg"
git push origin main
```
Quando estiver pronto para publicar seu site basta executar:
```
./deploy.sh
```

Feito isso acesse seu site em `<github-user>.github.io`.

### Produto final
Dê uma olhada nos repositórios deste site.  
[O repositório de desenvolvimento](https://github.com/tiagokrebs/tiagokrebs.github.io.dev).  
[O repositório do tema Clean White](https://github.com/zhaohuabing/hugo-theme-cleanwhite).  
[O repositório com a Github Page publicada](https://github.com/tiagokrebs/tiagokrebs.github.io).  
Este site [tiagokrebs.github.io](https://tiagokrebs.github.io).

## Utilizando seu domínio
Se você acessar o meu Github Pages pessoal em [tiagokrebs.github.io](https://tiagokrebs.github.io) vai notar o redirecionamento para https://tiagokrebs.com. A partir desse ponto o artigo traz a solução com custo mínimo para você usar seu próprio domínio na sua Github Page também.

### Comprando um domínio
Existem diversas plataformas onde você pode comprar o seu domínio. Registro.br, AWS, GoDaddy, Locaweb, Hostgator são algumas delas. Pela compra facilitada e a possibilidade de configuração de entradas DNS sem custo, nesse artigo vamos utilizar a [GoDaddy](https://www.godaddy.com). Acesse a plataforma, escolha seu domínio e faça a compra, o processo é simples e intuitivo. Eventualmente a GoDaddy tem promoções para registro acima de 1 ano e cupons de desconto disponíveis (Google it).

### Apontando seu domínio para o seu Github Pages
Depois de alguns minutos seu domínio estará pronto para ser utilizado. Acesse as configurações do seu domínio e procure pela opção **Gerenciar DNS**.

Para que seu site responda através de um domínio apex além do subdomínio www vamos precisar criar quatro entradas do tipo A e duas entradas do tipo CNAME no DNS da GoDaddy. Se precisar de ajuda confira as documentações oficiais em [Adicionar um Registro A](https://br.godaddy.com/help/adicionar-um-registro-a-19238) e [Adicionar um Registro CNAME](https://br.godaddy.com/help/adicionar-um-registro-cname-19236). Os registros tipo A devem apontar para os IPs do Github, verifique os IPs atuais em [Configuring a apex domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain).

Crie os registros A e CNAME conforme o exemplo do meu domínio pessoal abaixo. Essas configurações devem funcionar para qualquer outro serviço de DNS e não apenas para a GoDaddy.
![DNS tiagokrebs.com](/images/post/github-page/dns-tiagokrebs-com.png)

Teste se as suas configurações funcionam utilizando o comando `dig`. Se tudo estiver correto você verá uma resposta semelhante a abaixo para o seu domínio.
```
$ dig tiagokrebs.com +noall +answer -t A
tiagokrebs.com.		303	IN	A	185.199.110.153
tiagokrebs.com.		303	IN	A	185.199.108.153
tiagokrebs.com.		303	IN	A	185.199.109.153
tiagokrebs.com.		303	IN	A	185.199.111.153
```

### Adicionando um novo domínio ao seu Github Pages
Acesse as configurações do seu repositório do Github Pages e vá até o menu `Pages`. Informe o seu domínio no campo `Custom domain`.  
![Github Pages Custom Domain](/images/post/github-page/repo-settings.png)  
Nesse momento o Github vai validar se o seu domínio está configurado corretamente para ser utilizado. Depois do teste você pode habilitar a opção `Enforce HTTPS`. É comum que o DNS leve algumas horas para responder corretamente às novas configurações que você criou, caso a configuração do Github responda com erro tente novamente dentro de uma hora. Esse procedimento vai adicionar o arquivo `CNAME` no repositório do Github Pages, lembre-se de atualizar o subrepositório local na pasta `public`.
```
cd public
git fetch
git pull
```

E Voilà, acesse seu domínio e você será redirecionado ao seu Github Pages pessoal.  

## Referências
https://pages.github.com/  
https://github.com/gohugoio/hugo/releases  
https://gohugo.io/hosting-and-deployment/hosting-on-github/  
https://gohugo.io/content-management/toc/  
https://gohugo.io/getting-started/quick-start/  
https://hub.docker.com/r/klakegg/hugo/  
https://gohugo.io/getting-started/installing/  
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain

-------------------

Ficou na dúvida ou algum passo não funcinou para você? Me dê um ping, os contatos estão aqui no rodapé :)