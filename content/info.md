- npm i -g @nestjs/cli
- nest new nestjs-microservices

### tutorials

- nest g resource categories
- nest g resource technolgies
- nest g resource sections
- nest g resource topics

### authentication

- nest g resource auth
- nest g resource multi-factor-auth
- nest g resource session

- nest g app gateway
- nest g app tutorials
- nest g app authentication

- npm i @nestjs/microservices

- nest start gateway --watch
- nest start tutorials --watch
- nest start authentication --watch

- npm i amqlib amqp-connection-manager

- start RabbitMQ - docker run --name Rabbitmq -p 15672:15672 rabbitmq:3-management

### Docker with Rabbitmq setup

- http://localhost:3000/health

- npm i @clerk/backend
- npm i @nestjs/config
- npm i mongoose @nestjs/mongoose

- secuirty > authentication > implementing the authection gurad

- imports
- providers
- exports

// success response

// {
// "code": https status code
// "message": "",
// "data": {
// "categoryDto": {} /_ or _/ [],

// },
// }

// error response

// {
// "code": https status code
// "message": "",
// "data": null
// }

```js
✅ searching Features in This Version
Feature	Description
Fuzzy Search	Typo tolerance using fuzzy: { maxEdits: 1-2 }
Autocomplete	Prefix matching for instant suggestions
Exact match boost	exactTitleBoost & exactSlugBoost
Prefix boost	prefixTitleBoost
Recency boost	Newer items rank higher
Type boost	Business logic for course type
Popularity boost	Optional, uses views
Rating boost	Optional, uses averageRating
Pagination	$facet with skip & limit
Category filter	Optional categorySlug filter
Scalable	Uses MongoDB Atlas Search → millions of docs

```

```js
//error gateway
catch (err: any) {
      const error = err?.error || err;

      console.log('error handling =>', error);

      throw new HttpException(
        {
          success: false,
          message: error?.message || 'Something went wrong',
          code: error?.code,
        },
        error?.httpStatus || 500,
      );
    }
```
