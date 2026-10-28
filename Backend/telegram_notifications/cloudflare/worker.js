// Reloj del bot: cada minuto llama al procesador del backend con el secreto compartido.
export default {
  async scheduled(event, env) {
    const response = await fetch(env.PROCESS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.TELEGRAM_PROCESS_SECRET}` },
    });
    const body = await response.text();
    console.log(response.status, body.slice(0, 500));
    if (!response.ok) throw new Error(`Procesador respondió ${response.status}`);
  },
};
