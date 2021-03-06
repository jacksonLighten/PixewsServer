// <Pixews Server>
// Copyright (C) 2016  Jackson Lucas <jackson7br@gmail.com>

var Joi = require('joi')
var db = require('../utilities/database.js')
var empresas = db.empresas
var fotografos = db.fotografos
var TokenGenerator = require('../utilities/token.js')
var reqwest = require('request')
var debug = require('debug')('pixews:route:fotografo')
var Boom = require('boom')
var cmd = require('node-cmd')

const get = {
  method: 'GET',
  path: '/fotografo',
  handler: function (request, reply) {
    if(TokenGenerator.isValid(request.headers.token)) {
      fotografos.child(request.query.chave).on('value', function (snapshot) {
        var fotografo = snapshot.val()
        delete fotografo.senha

        reply(fotografo)
      })
    }
  },
  config: {
    description: 'Retornar Fotografo',
    notes: `
    @required atributo token:string em Headers<br>
    @example /fotografo?chave=-KPO80sjVWDUy4ATCZc9<br>
    @return Fotografo`,
    validate: {
      headers: Joi.object({
        token: Joi.string().required()
      }).options({ allowUnknown: true }),
      query: Joi.object({
        chave: Joi.string()
      })
    }
  }
}

const getImagens = {
  method: 'GET',
  path: '/fotografo/imagens',
  handler: function (request, reply) {
    // var chave = request.query.chave.replace(/-/g,'\\-')
    var chave = request.query.chave.replace(/-/g,'')
    debug(chave)
    if(TokenGenerator.isValid(request.headers.token)) {
      reqwest("http://localhost:8983/solr/pixews/select?wt=json&indent=true&rows=1000&q=fotografo_id:"+chave,
      function (error, response, body) {
        debug('response')
        debug(response.statusCode)
        debug(body)
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body)
          if (body.response) {

            reply(body.response.docs)
          } else {
            reply(body)
          }
        } else {
          debug(error)
          reply(Boom.badRequest('Response Not Valid!'))
        }
      })
    } else {
      reply(Boom.badRequest('Token Not Valid!'))
    }
  },
  config: {
    description: 'Retornar Imagens do Fotografo',
    notes: `
    @required atributo token:string em Headers<br>
    @example /fotografo/imagens?chave=12<br>
    @return Fotografo`,
    validate: {
      headers: Joi.object({
        token: Joi.string().required()
      }).options({ allowUnknown: true }),
      query: Joi.object({
        chave: Joi.string()
      })
    }
  }
}

const put = {
  method: 'PUT',
  path: '/fotografo',
  handler: function (request, reply) {
    var fotografo = request.payload
    var novoFotografo = fotografos.push(fotografo)
    var token = TokenGenerator.generate()
    var key = novoFotografo.key

    reply({'token': token, 'chave': key})
  },
  config: {
    description: 'Criar Fotografo',
    notes: '@return {token: string, chave: string, usuario: Fotografo}',
    validate: {
      payload: Joi.object({
        email: Joi.string().email(),
        nome: Joi.string(),
        senha: Joi.string(),
        estado: Joi.string(),
        pais: Joi.string()
      }).example({
        email: 'lyso@icomp.ufam.edu.br',
        senha: '123456',
        nome: 'Leandro Youiti Silva Okimoto',
        estado: 'AM',
        pais: 'Brasil'
      })
    }
  }
}

const post = {
  method: 'POST',
  path: '/fotografo',
  handler: function (request, reply) {
    var query, user;
    fotografos.orderByChild('email')
      .equalTo(request.payload.email).limitToFirst(1)
      .on('value', function (snapshot) {
        var token, key
        debug('fotografo login')
        cmd.run(`echo '>>>>>>>>>> FOTOGRAFO LOGIN <<<<<<<<<<' >> public/log.txt`)
        user = snapshot.val()

        if (!user) {
          return reply({'erro': 'Usuário não encontrado'})
        }

        key = Object.keys(user)[0]
        user = user[key]

        if (user.senha == request.payload.senha) {
          token = TokenGenerator.generate()

          delete user.senha

          reply({'token': token, 'chave': key, 'usuario': user})
        } else {
          reply(Boom.badRequest('User Credentials Not Valid!'))
        }
      })
  },
  config: {
    description: 'Login Fotografo',
    notes: `@return 200 {token: string, chave: string, usuario: Fotografo}</br>
            @return 401 {erro: 401}`,
    validate: {
      payload: Joi.object({
        email: Joi.string().email(),
        senha: Joi.string()
      }).example({
        email: 'lyso@icomp.ufam.edu.br',
        senha: '123456'
      })
    }
  }
}

const patch = {
  method: 'PATCH',
  path: '/fotografo',
  handler: function (request, reply) {
    if(TokenGenerator.isValid(request.headers.token)) {
      fotografos.child(request.payload.chave).update(request.payload.user)
      reply({'mensagem': 'ok'})
    } else {
      reply(Boom.badRequest('Token Not Valid!'))
    }
  },
  config: {
    description: 'Alterar Fotografo',
    notes: `@required atributo token:string em Headers<br>
            @return 200 {mensagem: "ok"}<br>
            @return 400 {mensagem: string}`,
    validate: {
      headers: Joi.object({
        token: Joi.string().required()
      }).options({ allowUnknown: true }),
      payload: Joi.object({
        chave: Joi.string().required(),
        user: Joi.object({
          nome: Joi.string().optional().notes('Opcional'),
          estado: Joi.string().optional().notes('Opcional'),
          pais: Joi.string().optional().notes('Opcional')
        })
      }).example({
        'chave': '-KPLQFyeto3QWooOPdjr',
        'user': {
          'nome': 'Leandro Okimoto'
        }
      })
    }
  }
}

module.exports = {
  'get': get,
  'getImagens': getImagens,
  'put': put,
  'post': post,
  'patch': patch
}