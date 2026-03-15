/**
 * Servicio para integración con Nave (Naranja X)
 * Documentación: https://navenegocios.ar/home/developers
 */

const BASE_URL_AUTH = 'https://homoservices.apinararanja.com/security-ms/api/v1/login/merchant';
const BASE_URL_PAYMENT = 'https://api-sandbox.ranty.io/api/payment_request/ecommerce';

const CLIENT_ID = import.meta.env.VITE_NAVEX_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_NAVEX_CLIENT_SECRET;
const POS_ID = import.meta.env.VITE_NAVEX_POS_ID;

export const getNaveToken = async () => {
    try {
        const response = await fetch(BASE_URL_AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                audience: "https://naranja.com/ranty/merchants/api"
            })
        });

        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("Error obteniendo token de Nave:", error);
        throw error;
    }
};

export const createPaymentLink = async (orderData) => {
    try {
        const token = await getNaveToken();
        
        const response = await fetch(BASE_URL_PAYMENT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                external_payment_id: orderData.id,
                seller: { pos_id: POS_ID },
                transactions: [
                    {
                        amount: {
                            currency: "ARS",
                            value: parseFloat(orderData.total)
                        },
                        description: `AquaGest Pedido #${orderData.id.split('-')[0]}`
                    }
                ],
                // El callback_url es donde vuelve el CLIENTE
                urls: {
                    callback_url: window.location.origin,
                }
            })
        });

        const data = await response.json();
        return data.checkout_url;
    } catch (error) {
        console.error("Error creando link en Nave:", error);
        throw error;
    }
};
