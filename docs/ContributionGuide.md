# Contribution Guide

Follow these steps to build and run the site on your local machine.

## 1. SurrealDB

Once you are have installed [SurrealDB](https://docs.surrealdb.com/docs/introduction/start/) on your local machine or a remote server, you will need to run it. Run the following command and replace `<username>`, `<password>`, and `<path_to_database_file>` with whatever values you'd like to use for your development environment.

```bash
surreal start --user <username> --pass <password> file:<path_to_database_file>
```

## 2. Setup Repository

Clone the repo from GitHub into your development environment. You will need to have at minimum the latest version of `nodejs 18`, and `yarn` installed. I recommend using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage your `nodejs` installations. You can `install` yarn globally with the following command.

```bash
npm install --global yarn
```

## 3. Environment Variables

You will need to populate a `.env` file with a few specific parameters which the site will use. Here is a template of what values you need to provide.

```bash
BASE_URL= # the address of your running Nuxt instance. Ex: http://localhost:3000

SURREAL_URL= # the address of your running SurrealDB instance. Ex: http://localhost:8000/rpc
SURREAL_USERNAME= # your SurrealDB root username
SURREAL_PASSWORD= # your SurrealDB root password
SURREAL_NAMESPACE= # the namespace you'd like to use. Ex: dox
SURREAL_DATABASE= # the database you'd like to use. Ex: development

# OPTIONAL, only supply if needing to send emails
# you can use your personal gmail account as an SMTP server
# https://support.google.com/a/answer/176600?
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

## 4. Run It

With your SurrealDB instance running, you can start the site with the following command.

```bash
yarn dev
```

If you have setup everything correctly, then you will see the following

```bash
...
Connected to <namespace>:<database>
```

## 5. Sync Database Schema

With the site and database running, you will need to sync the schema to define all the necessary scopes, tables, events, etc. You will need to use the SurrealDB CLI and the `import` command to run the `schema.surql` file in the `~/server/assets` directory. Run the following command to do this.

```bash
surreal import --conn <surrealdb_url> --user <username> --pass <password> --ns dox --db development <path_to_schema_surql>
```

> Once completed the first time, you can sync the schema from within the site much easier.

## It's Running

If you did everything correctly, then you should be able to open the site in your browser and everything should be working correctly. There is an interactive `repl` you can use to interact with the database manually, you can use this to assign a user as an admin for example. You can access it with the following command.

```bash
surreal sql
```
