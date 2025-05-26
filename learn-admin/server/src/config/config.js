module.exports = {
  development: {
    port: 3000,
    database: {
      storage: './school_management.sqlite',
      dialect: 'sqlite'
    },
    jwt: {
      secret: 'your_jwt_secret_key',
      expiresIn: '24h'
    }
  },
  production: {
    port: process.env.PORT || 3000,
    database: {
      storage: process.env.DB_STORAGE || './school_management.sqlite',
      dialect: 'sqlite'
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  }
}; 