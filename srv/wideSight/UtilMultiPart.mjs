export class UtilMultiPart {
    static async readStreamToBytes(readStream) {
        const buffer = [];
        return new Promise((resolve, reject) => {
            readStream.on("data", (chunk) => {
                buffer.push(chunk);
            });

            readStream.on("end", () => {
                readStream.close();
                resolve(Buffer.concat(buffer));
            });
        });
    }
}