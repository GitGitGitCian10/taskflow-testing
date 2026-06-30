// Shim de tipos para allure-vitest (v2).
// El paquete expone sus tipos vía "exports" con condición "import", que
// moduleResolution: "Node" (clásico) no resuelve. Este shim cubre la API que usamos.
declare module 'allure-vitest' {
  export interface AllureApi {
    label(name: string, value: string): Promise<void>
    link(type: string, url: string, name?: string): Promise<void>
    feature(name: string): Promise<void>
    story(name: string): Promise<void>
    epic(name: string): Promise<void>
    severity(name: string): Promise<void>
    tag(name: string): Promise<void>
    description(markdown: string): Promise<void>
    step(name: string, body: () => Promise<void> | void): Promise<void>
    attachment(name: string, content: Buffer | string, type: string): Promise<void>
  }
  export function bindAllureApi(task: unknown): AllureApi
}
