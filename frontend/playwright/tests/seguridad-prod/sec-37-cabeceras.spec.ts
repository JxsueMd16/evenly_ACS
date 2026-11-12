import { expect, test } from "@playwright/test"

/**
 * SEC-37 (RNF-06, regresión de DEF-008): el frontend desplegado envía las
 * cabeceras de seguridad. Corre contra producción: PROD_URL.
 */
const PROD_URL = process.env.PROD_URL ?? "https://evenly-acs.vercel.app"
const API_ORIGIN = process.env.PROD_API_URL ?? "https://evenly-api-4b1b.onrender.com"

test.describe("SEC-37 cabeceras de seguridad del frontend", () => {
  for (const path of ["/login", "/", "/groups/cualquier-id"]) {
    test(`SEC-37 ${path} trae CSP, anti-clickjacking, nosniff, Referrer-Policy y Permissions-Policy`, async ({ request }) => {
      const res = await request.get(`${PROD_URL}${path}`)
      expect(res.status()).toBe(200)
      const h = res.headers()

      const csp = h["content-security-policy"] ?? ""
      expect(csp, "Content-Security-Policy").toContain("default-src 'self'")
      expect(csp, "solo scripts propios").toContain("script-src 'self'")
      expect(csp, "no se puede incrustar en otro sitio").toContain("frame-ancestors 'none'")
      expect(csp, "la app solo habla con su API").toContain(`connect-src 'self' ${API_ORIGIN}`)
      expect(csp, "sin plugins").toContain("object-src 'none'")
      expect(h["x-frame-options"]).toBe("DENY")
      expect(h["x-content-type-options"]).toBe("nosniff")
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin")
      expect(h["permissions-policy"]).toContain("camera=()")
      expect(h["strict-transport-security"]).toContain("max-age=")
    })
  }

  test("SEC-37 la app carga en producción sin violaciones de la CSP", async ({ page }) => {
    const violations: string[] = []
    page.on("console", (msg) => {
      if (/Content Security Policy|Refused to/i.test(msg.text())) violations.push(msg.text())
    })
    await page.goto(`${PROD_URL}/login`)
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible()
    expect(violations).toEqual([])
  })
})
