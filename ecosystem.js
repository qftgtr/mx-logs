{
  apps: [
    {
      name: "mx-logs",
      script: "index.js",
      env: {
        COMMON_VARIABLE: "true"
      },
      env_production : {
        NODE_ENV: "production",
        MONGO_URI: "mongodb://localhost:27017/mx-logs"
      }
    }
  ],
  deploy: {
    production : {
      user: "root",
      host: "101.200.184.194",
      ref: "origin/master",
      repo: "https://github.com/qftgtr/mx-logs.git",
      path: "/var/www/mx-logs",
      "post-deploy": "pwd;npm install --production;pm2 startOrRestart --env production",
      env: {
        NODE_ENV: "production",
        MONGO_URI: "mongodb://localhost:27017/mx-logs"
      }
    }
  }
}
