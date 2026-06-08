# Project Overview
Next.js KPI Chatbot Frontend. It provides a modern, responsive user interface for role-based natural-language KPI querying, rendering real-time streamed responses, interactive ambiguity clarification flows, generated KPI charts, and administrative dashboards for user/chatbot management.

Main flows:
* **Real-time Streaming Chat**: Renders text chunks as they arrive from the FastAPI backend SSE (Server-Sent Events) stream.
* **Interactive Ambiguity Clarification**: Dynamically displays multi-question clarification cards with single/multi-select options, free-text inputs, and skip capabilities before generating answers.
* **Chart Visualization**: Integrates API-provided chart URLs directly within the chat bubble timeline.
* **Role-Based Portals**: Guards user-scoped chat sessions and locks admin-only dashboards (User Management, Chatbot Addon Prompts, Data Ingestion/Scheduler triggers).

---

# Stack
* **Next.js 16 (App Router)** & **React 19**
* **TypeScript 5.9** for strict type checking
* **Tailwind CSS 4** & **PostCSS** for responsive utility-first styling
* **Axios** with auth interceptors for network requests and stream ingestion
* **Docker** multi-stage base optimized for standalone Next.js builds

---

# Project Structure
```text
src/
├── app/          # Next.js page routes, layouts, and API proxies
│   ├── (admin)/  # Admin-only dashboards (users, chatbots, dashboard stats)
│   ├── (full-width-pages)/
│   │   ├── (auth)/   # Auth flows: signin, signup, reset-password
│   │   └── chat/     # Core chatbot interface
│   └── ClientLayout.tsx
├── components/   # Modular React components
│   ├── auth/     # Sign-in and Sign-up components
│   ├── chat/     # Bubble, InputBar, MessageList, ClarifyCard, Sidebar, SessionRow
│   ├── chatbot/  # Chatbot config forms and lists
│   ├── common/   # Modals, Toast, Breadcrumbs
│   ├── tables/   # Data tables for admin portals
│   └── ui/       # Buttons, cards, and input primitives
├── context/      # Global React Contexts (Auth, Theme, Toast, Sidebar)
├── hooks/        # UI-bound business logic and async hooks (useChat, useScheduler)
├── services/     # Axios API services (authService, chatService, userService)
├── types/        # Global TypeScript interfaces (chat, user, chatbot)
└── utils/        # Token decoders, string helpers, date formatters
```

---

# Key Runtime Modules
* **[middleware.ts](file:///d:/Kuliah/TA/Chatbot_KPI_FE/middleware.ts)**: Intercepts requests, validates JWT cookies, and implements client-side role guarding (redirecting unauthenticated users to `/signin` and blocking non-admins from `/users` and `/chatbots`).
* **[src/services/apiClientWithAuth.ts](file:///d:/Kuliah/TA/Chatbot_KPI_FE/src/services/apiClientWithAuth.ts)**: Axios wrapper featuring automated token rotation (JWT token refreshment logic on `401 Unauthorized` responses) and request interceptors.
* **[src/hooks/useChat.ts](file:///d:/Kuliah/TA/Chatbot_KPI_FE/src/hooks/useChat.ts)**: Manages SSE-based streaming chunks, optimistic UI rendering, temporary/real ID resolution, typing indicators, and session states.
* **[src/components/chat/ClarifyCard.tsx](file:///d:/Kuliah/TA/Chatbot_KPI_FE/src/components/chat/ClarifyCard.tsx)**: Handles interactive multi-step clarification question states, storing selected answers or free-text responses before posting them back to the chat pipeline.

---

# Configuration
Environment configuration is handled via `.env.local` for local development and build-time args for production Docker containers.

```ini
# Base URL for the FastAPI backend service
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> [!IMPORTANT]
> Because Next.js optimizes and bakes `NEXT_PUBLIC_` prefixed variables during **build time**, you must specify `NEXT_PUBLIC_API_URL` during the `docker build` process if it points to a production endpoint.

---

# Commands

### Local Development
```bash
# Install dependencies
npm install

# Run the dev server with Turbopack
npm run dev

# Run ESLint linter
npm run lint
```

### Production Build & Local Run
```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

### Docker (Containerization)
```bash
# Build the optimized standalone production image
docker build -t chatbot-fe .

# Build with custom backend API URL
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.kpi-chatbot.com -t chatbot-fe .

# Run the container locally at port 3000
docker run -p 3000:3000 chatbot-fe
```

---

# Code Patterns
* **Decoupled API Logic**: Do not place `fetch`/`axios` requests directly inside components. Use dedicated API modules in `services/` and fetch within custom hooks.
* **TypeScript Casting**: Ensure types returned from dynamic arrays are casted properly (e.g. using `as const` or `as 'text' | 'clarify'` in state setters) to prevent compilation failures during Docker builds.
* **Strict Route Protection**: Keep all route validation logic in [middleware.ts](file:///d:/Kuliah/TA/Chatbot_KPI_FE/middleware.ts) to avoid content flickering on slow loads.
* **Context over Props**: For core UX workflows (Toast alerts, Theme switching, Auth states), utilize React Context hooks (`useToast`, `useAuth`, `useTheme`) instead of prop drilling.
