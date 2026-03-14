<!-- docs/REPO_RULES.md -->

# Rosie Dazzlers — Repository Rules

This document defines the **non-negotiable rules** for modifying the Rosie Dazzlers codebase.

These rules exist to prevent architectural drift and ensure that future development (human or AI) maintains the intended design of the system.

Any AI assistant helping with this repository **must follow these rules**.

---

# 1) Preserve the Architecture

The Rosie Dazzlers platform is intentionally built as:

Static Website  
+  
Serverless API  
+  
Supabase Database  
+  
Stripe Payments  
+  
Cloudflare R2 Image Hosting

Architecture flow:

Browser  
↓  
Cloudflare Pages (static site)  
↓  
Pages Functions (`/functions/api`)  
↓  
Supabase (Postgres)  
↓  
Stripe  
↓  
R2 storage

Do **not** introduce frameworks or changes that break this architecture.

---

# 2) Do Not Introduce Frontend Frameworks

This project is intentionally a **static HTML site**.

Do not introduce:

React  
Next.js  
Vue  
Angular  
Svelte  
Astro  

Static HTML + JavaScript is the intended design.

---

# 3) Backend Must Remain Serverless

Backend logic must remain inside:
