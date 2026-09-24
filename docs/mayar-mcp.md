# Integrasi Mayar MCP

Web app BGY Store memakai REST API Mayar untuk checkout dan webhook. MCP Mayar dipakai untuk client/agent admin yang ingin menjalankan tool Mayar seperti membuat invoice, mengecek invoice, coupon, dan webhook dari luar aplikasi.

## Server MCP

```json
{
  "mcpServers": {
    "mayar": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.mayar.id/sse",
        "--header",
        "Authorization:${MAYAR_API_KEY}"
      ],
      "env": {
        "MAYAR_API_KEY": "isi_api_key_mayar"
      }
    }
  }
}
```

## Environment web app

```env
MAYAR_API_KEY=isi_api_key_mayar
MAYAR_WEBHOOK_SECRET=isi_webhook_secret_mayar
MAYAR_API_URL=https://api.mayar.id/hl/v2
NEXT_PUBLIC_SITE_URL=https://domain-kamu
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_supabase
```

## Webhook

Daftarkan webhook Mayar ke:

```text
https://domain-kamu/api/webhook/mayar
```

Alur pembayaran:

1. Checkout membuat order pending di Supabase.
2. App membuat invoice Mayar dengan `referenceId` berisi ID order.
3. Pembeli diarahkan ke link pembayaran Mayar.
4. Mayar mengirim webhook ke app.
5. App mengubah order menjadi paid, membuat token download, dan mengurangi stok jika produk limited.
