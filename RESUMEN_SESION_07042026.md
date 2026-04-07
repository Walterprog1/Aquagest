# Resumen de Sesión - 07/04/2026

## Webhooks de Pago Automático

### Problema Inicial
- NaranjaX envía notificaciones de transferencia
- MacroDroid captura el mensaje y llama a webhooks
- Dos webhooks: webhook-notificaciones (bidones) y webhook-alquiler (dispenser)

### Problemas Encontrados
1. El webhook-alquiler usaba `supabase.auth.getUser()` que siempre fallaba porque no hay sesión de usuario en el webhook
2. La extracción del monto tomaba solo el primer dígito (ej: $28.000 -> 28)
3. Ambos webhooks procesaban el mismo pago, creando conflicto

### Solución Implementada
Se unificaron ambos webhooks en **webhook-notificaciones** (archivo: webhook-pagos-v4.txt):

```javascript
// Extraer monto - busca $ seguido de número
const match = texto.match(/\$[\s]*([\d.]+)/)
const montoStr = match[1].replace(/\./g, '')
montoLimpio = parseInt(montoStr, 10)
```

**Lógica de distribución de pagos:**
1. Busca pedido pendiente de bidones → lo paga
2. Si hay dispenser instalado y sobra >= $25000 → registra alquiler
3. Si envía $28000 → paga bidones ($3000) + alquiler ($25000), resto $0
4. Los 3 bidones gratis los maneja la app al crear el pedido

### Cambios en la App
1. **Borrado botón "Cobrado"** en PedidosListModal - ahora solo se puede cambiar el estado editando el pedido y cambiando "Método de Pago"
2. **Auto-refresh cada 10 segundos** en la ventana de Gestión Integral de Pedidos

### Cómo actualizar el webhook en Supabase
El archivo `webhook-pagos-v4.txt` contiene el código actual. Pegarlo en:
- Supabase → Edge Functions → webhook-notificaciones → Deploy

### Estado actual de los archivos en el proyecto
- webhook-pagos-v4.txt → último código del webhook unificado
- webhook-notificaciones.txt → versión anterior (bidones)
- webhook-alquiler.txt → versión anterior (alquiler)

### Notas importantes
- El webhook funciona con service_role_key (bypass RLS)
- El regex ahora captura correctamente números con formato argentino ($25.000 = 25000)
- Se decodifica URL antes de procesar: decodeURIComponent(texto)
- Los cambios en la app se suben automáticamente a Vercel por Git

### Pendientes / Futuras mejoras
- Agregar opción para editar manualmente el estado de pago en el formulario de pedido
- Posible integración de ML para predicción de demanda