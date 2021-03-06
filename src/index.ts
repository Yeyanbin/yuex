import { reactive } from "@vue/reactivity";

export type TContext<THandlerKey extends string, IAction> = {
  action: IAction,
  stateProxy: {
    [key in THandlerKey]: any;
  };
}

export type TStateHandler<IState, THandlerKey extends string> = {
  [key in THandlerKey]: {
    get: (state: IState) => any;
    set: (state: IState, arg: any) => void;
  };
}

export interface IVuezAction { 
  [key: string]: (...args: any[]) => void;
}

export interface IVuezState { 
  [key: string]: object | number | string | boolean;
}

class MyModule<IAction, IState, IStateHandler> {
  
  action: IAction;
  stateProxy: {[key in keyof IStateHandler]: any};

  constructor(action: { [key in keyof IAction]: any}, state: IState, stateHandler: IStateHandler) {
    state = reactive(state as Object) as IState;
    this.stateProxy = new Proxy({}, {
      get: (_, p) => {
        return (stateHandler as any)[p as string].get(state);
      },
      set: (_, p, value) => {
        (stateHandler as any)[p as string].set(state, value);
        return true;
      }
    }) as {[key in keyof IStateHandler]: any}

    this.action = new Proxy(action as Object, {
      get(target, p: string) {
        return (...args: any[]) => {
          (target as any)[p](context, ...args);
        }
      },
      set(target, p, v, r) {
        return false;
      }
    }) as IAction;

    const context = {
      action: this.action,
      stateProxy: this.stateProxy, 
    }
  }
}

export function createModule<IAction extends IVuezAction, IState extends IVuezState, THandlerKey extends string>(
  action: { [key in keyof IAction]: any}, 
  state: IState, stateHandler: 
  TStateHandler<IState, THandlerKey>)
  {
  return new MyModule<IAction, IState, TStateHandler<IState, THandlerKey>>(action, state, stateHandler);
}