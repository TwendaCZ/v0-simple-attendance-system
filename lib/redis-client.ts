import { Redis } from "@upstash/redis"

// Vytvoření Redis klienta s přímými přihlašovacími údaji
const redis = new Redis({
  url: "https://primary-collie-38680.upstash.io",
  token: "AZcYAAIjcDEyZWIyYjRmYTEzMzM0MmM0YmY1MThhNDNmYTYzM2RlNHAxMA",
})

export default redis
