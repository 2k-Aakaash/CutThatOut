import {execSync} from "child_process"
import fs from "fs"
import path from "path"
import {fileURLToPath} from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log("🚀 Starting deployment from dev branch...\n")

let tempDistPath = null

try {
  // Ensure on dev branch
  console.log("📍 Checking current branch...")
  let currentBranch = execSync("git branch --show-current").toString().trim()

  if (currentBranch !== "dev") {
    console.log("🔄 Switching to dev...")
    execSync("git checkout dev", {stdio: "inherit"})
  }

  // Stash changes (excluding temp-dist)
  console.log("📦 Stashing changes...")
  execSync('git stash push -u -m "temp stash before deploy" -- deploy.js', {
    stdio: "inherit",
  })

  // Build
  console.log("📦 Building project...")
  execSync("npx vite build", {stdio: "inherit"})

  // Copy dist to temp
  console.log("📦 Copying dist to temporary location...")
  const distPath = path.join(__dirname, "dist")
  tempDistPath = path.join(__dirname, "temp-dist")

  if (fs.existsSync(tempDistPath))
    fs.rmSync(tempDistPath, {recursive: true, force: true})
  fs.cpSync(distPath, tempDistPath, {recursive: true})

  // Remove dist from working directory
  console.log("🗑️ Removing dist folder...")
  fs.rmSync(distPath, {recursive: true, force: true})

  // Switch to main
  console.log("🔄 Switching to main branch...")
  execSync("git checkout main", {stdio: "inherit"})

  // Clean main branch
  console.log("🧹 Cleaning main branch...")
  const files = fs.readdirSync(".")
  for (const file of files) {
    if (
      file !== ".git" &&
      file !== "deploy.js" &&
      file !== "node_modules" &&
      file !== "temp-dist"
    ) {
      fs.rmSync(file, {recursive: true, force: true})
    }
  }

  // Copy build files
  console.log("📋 Copying build files to main...")
  const tempFiles = fs.readdirSync(tempDistPath)
  for (const file of tempFiles) {
    fs.cpSync(path.join(tempDistPath, file), file, {recursive: true})
  }

  fs.writeFileSync(".nojekyll", "")

  // Commit and push
  console.log("📤 Committing & pushing...")
  execSync("git add .", {stdio: "inherit"})
  execSync(
    `git commit -m "chore: deploy new build - ${new Date().toISOString()}"`,
    {stdio: "inherit"},
  )
  execSync("git push origin main --force", {stdio: "inherit"})

  console.log("\n✅ Deployment to main completed successfully! 🎉")
} catch (error) {
  console.error("\n❌ Deployment failed:")
  console.error(error.message)
  process.exit(1)
} finally {
  // Cleanup
  if (tempDistPath && fs.existsSync(tempDistPath)) {
    fs.rmSync(tempDistPath, {recursive: true, force: true})
  }

  // Return to dev branch
  try {
    console.log("\n🔄 Returning to dev branch...")
    execSync("git checkout dev", {stdio: "inherit"})

    // Try to restore stash
    try {
      execSync("git stash pop", {stdio: "inherit"})
      console.log("✅ Stash restored successfully.")
    } catch (stashError) {
      console.log("⚠️  Stash pop had minor conflicts (usually safe to ignore).")
    }
  } catch (e) {
    console.log("⚠️  Could not automatically return to dev branch.")
  }
}
