
// Sovereign Sensor Interface
// Handles access to Ambient Light Sensor and other emerging hardware APIs

export const initializeLightSensor = (onReading: (lux: number) => void) => {
    if ('AmbientLightSensor' in window) {
        try {
            // @ts-ignore - Types not fully standard yet
            const sensor = new AmbientLightSensor();
            sensor.addEventListener('reading', () => {
                onReading(sensor.illuminance);
            });
            sensor.addEventListener('error', (event: any) => {
                console.warn("Light Sensor Error:", event.error.name, event.error.message);
            });
            sensor.start();
            return () => sensor.stop();
        } catch (e) {
            console.warn("Ambient Light Sensor not supported or permission denied.");
            return () => {};
        }
    }
    return () => {};
};
