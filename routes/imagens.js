// <Pixews Server>
// Copyright (C) 2016  Jackson Lucas <jackson7br@gmail.com>

var Joi = require('joi')
var db = require('../utilities/database.js')
var empresas = db.empresas
var fotografos = db.fotografos
var TokenGenerator = require('../utilities/token.js')
var reqwest = require('request')
var debug = require('debug')('pixews:route:imagens')
var promise = require('bluebird')
var Boom = require('boom')
var cmd = require('node-cmd')

const get = {
  method: 'GET',
  path: '/imagens',
  handler: function (request, reply) {
    debug('get imagens')
    if(TokenGenerator.isValid(request.headers.token)) {
      var query = ''
      var parameters = request.query.tags.split(' ')
      var lat = request.query.lat
      var lon = request.query.lon
      debug('position')
      debug(lat)
      debug(lon)

      query = '%2B' + parameters[0]

      var index;
      for (index = 1; index < parameters.length; index++) {
        query += '+%2B' + parameters[index]
      }

      var link;
      if (lat && lon) {
         link = `http://localhost:8983/solr/pixews/select?wt=json&indent=true&rows=1000&q=${query}&fq={!geofilt%20sfield=localizacao}&pt=${lat},${lon}&d=1000`
      } else {
        link = `http://localhost:8983/solr/pixews/select?wt=json&indent=true&rows=1000&q=${query}`
      }

      reqwest(link, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body)
          reply(body.response.docs)
        } else {
          debug(error)
          reply(Boom.badRequest('Response Not Valid!'))
        }
      })
    } else {
      reply(Boom.badRequest('Token not valid!'))
    }

  },
  config: {
    description: 'Busca de Imagens por Tags',
    notes: `
    @required atributo token:string em Headers<br>
    @example /imagens?tags=olimpiada+futebol<br>
    @return SolrResponse`,
    validate: {
      headers: Joi.object({
        token: Joi.string().required()
      }).options({ allowUnknown: true }),
      query: Joi.object({
        tags: Joi.string(),
        lat: Joi.string().optional(),
        lon: Joi.string().optional()
      })
    }
  }
}

const getMaisVendidas = {
  method: 'GET',
  path: '/imagens/mais-vendidas',
  handler: function (request, reply) {
    debug('get imagens mais vendidas')
    cmd.run(`echo '>>>>>>>>>> MAIS VENDIDAS <<<<<<<<<<' >> public/log.txt`)
    if(TokenGenerator.isValid(request.headers.token)) {
      var query = ''
      var parameters = request.query.tags.split(' ')

      query = '%2B' + parameters[0]

      var index;
      for (index = 1; index < parameters.length; index++) {
        query += '+%2B' + parameters[index]
      }

      debug('request.query')
      debug(request.query)

      reqwest(`http://localhost:8983/solr/pixews/select?wt=json&indent=true&q=${query}&fq={!geofilt%20sfield=localizacao}&pt=${request.query.lat},${request.query.lon}&d=1000&sort=vendas+desc`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body)
          reply(body.response.docs)
        } else {
          reply(Boom.badRequest('Response Not Valid!'))
        }
      })
    } else {
      reply(Boom.badRequest('Token Not Valid!'))
    }

  },
  config: {
    description: 'Busca as Imagens Mais Vendidas (Melhores Imagens)',
    notes: `
    @required atributo token:string em Headers<br>
    @example /imagens?tags=olimpiada+futebol<br>
    @return SolrResponse`,
    validate: {
      headers: Joi.object({
        token: Joi.string().required()
      }).options({ allowUnknown: true }),
      query: Joi.object({
        tags: Joi.string(),
        lat: Joi.string().optional(),
        lon: Joi.string().optional()
      })
    }
  }
}

module.exports = {
  'get': get,
  'getMaisVendidas': getMaisVendidas
}