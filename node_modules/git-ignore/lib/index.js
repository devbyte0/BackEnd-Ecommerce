const axios = require('axios')

const { languages } = require('../lib/languages')

const choices = languages.map((lang) => lang.split('.')[0])

const githubGitignoreUri = (lang) => `https://raw.githubusercontent.com/github/gitignore/master/${lang}.gitignore`

const createGitignoreFile = (lang) => {
  return new Promise((resolve, reject) => {
    axios.get(githubGitignoreUri(lang))
      .then((response) => resolve(response))
      .catch((err) => reject(err))
  })
}

const capitalizeFirstLetter = (word) => word.charAt(0).toUpperCase() + word.slice(1)

module.exports = { choices, createGitignoreFile, capitalizeFirstLetter }
