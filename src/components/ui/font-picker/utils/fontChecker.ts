export type FontStyle = "italic" | "normal";
export type FontWeight =
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | 1000;

export interface CheckLoadedOptions {
  fontFamily: string;
  fontStyle?: FontStyle;
  fontWeight?: FontWeight;
  timeout?: number;
}



export async function checkLoaded({
  fontFamily,
  fontStyle,
  fontWeight,
  timeout = 500,
}: CheckLoadedOptions): Promise<boolean> {
  const start = Date.now();
  
  let timeoutId: ReturnType<typeof setTimeout>;

  return new Promise((resolve, reject) => {
    if (document?.fonts) {
      const checker = new Promise<boolean>((resolve, reject) => {
        const check = () => {
          const now = Date.now();
          if (now - start >= timeout) {
            reject(new Error(`Font not loaded within ${timeout} ms`));
          } else {
            
            const loaded = document.fonts.check(
              `${fontStyle ?? ""} ${fontWeight ?? ""} 0 ${fontFamily}`,
            );
            if (loaded) {
              resolve(true);
            } else {
              setTimeout(check, 25);
            }
          }
        };
        check();
      });
      const timer = new Promise<boolean>((_resolve, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Font not loaded within ${timeout} ms`)),
          timeout,
        );
      });
      Promise.race<boolean>([timer, checker]).then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      }, reject);
    } else {
      reject(new Error("Fonts API not supported by client"));
    }
  });
}
