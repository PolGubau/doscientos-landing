const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const blogDir = 'src/content/blog'
const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.mdx'))

files.forEach((file) => {
  const content = fs.readFileSync(path.join(blogDir, file), 'utf8')
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (match) {
    try {
      yaml.load(match[1])
      console.log(`OK: ${file}`)
    } catch (e) {
      console.log(`FAIL: ${file}`)
      console.log(e.message)
    }
  } else {
    console.log(`NO FRONTMATTER: ${file}`)
  }
})
