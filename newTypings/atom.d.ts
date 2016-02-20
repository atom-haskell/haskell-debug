declare module "atom"{
    class Emitter{
        clear(): void;
        dispose(): void;

        on(eventName: string, handler: Function): AtomCore.Disposable;
        preempt(eventName: string, handler: Function): AtomCore.Disposable;

        emit(eventName: string, value: any): void;
    }
}
