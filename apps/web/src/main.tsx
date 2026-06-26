import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@workspace/ui/globals.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

const rootElement = document.getElementById("root")!

document.documentElement.classList.add("dark")
document.documentElement.style.width = "100%"
document.documentElement.style.height = "100%"
document.documentElement.style.margin = "0"
document.documentElement.style.overflow = "hidden"
document.documentElement.style.background = "#030303"

document.body.style.width = "100%"
document.body.style.height = "100%"
document.body.style.margin = "0"
document.body.style.overflow = "hidden"
document.body.style.background = "#030303"

rootElement.style.width = "100vw"
rootElement.style.height = "100vh"
rootElement.style.margin = "0"
rootElement.style.overflow = "hidden"
rootElement.style.background = "#030303"

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="3d-gallery-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
)
