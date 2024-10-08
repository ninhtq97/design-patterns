interface IHandler<Req = Record<string, any>, Res = boolean> {
  next(handler: IHandler<Req, Res>): IHandler<Req, Res>;
  handle(request: Req): Res;
}

abstract class AbstractHandler implements IHandler {
  private nextHandler: IHandler;

  public next(handler: IHandler): IHandler {
    this.nextHandler = handler;
    return handler;
  }

  public handle(request: Record<string, any>): boolean {
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }

    return true;
  }
}

class AuthenticationHandler extends AbstractHandler {
  public handle(req: Record<string, any>): boolean {
    console.log('Authentication handler ...');
    const { username, password } = req.body;

    if (
      !['admin', 'user'].includes(username) &&
      !['admin', 'user'].includes(password)
    ) {
      return false;
    }

    req.user = { username, role: username, isActive: true };

    return super.handle(req);
  }
}

class AuthorizationHandler extends AbstractHandler {
  public handle(req: Record<string, any>): boolean {
    console.log('Authorization handler ...');

    const { role } = req.user;
    if (role !== 'admin') return false;

    return super.handle(req);
  }
}

class ActivateHandler extends AbstractHandler {
  public handle(req: Record<string, any>): boolean {
    console.log('Activate handler ...');

    const { isActive } = req.user;
    if (!isActive) return false;

    return super.handle(req);
  }
}

const useMiddlewares = (middlewares: IHandler[]) => {
  if (!middlewares.length) return;

  const node = middlewares.at(0);
  let currentNode = node;

  for (let i = 1; i < middlewares.length; i++) {
    const middleware = middlewares[i];
    currentNode.next(middleware);
    currentNode = middleware;
  }

  return node;
};

class Service {
  protected handler: IHandler;

  middlewares(...handlers: IHandler[]) {
    this.handler = useMiddlewares(handlers);
  }

  handle(): void {
    const req = { body: { username: 'guest', password: 'guest' } };

    if (this.handler) {
      const res = this.handler.handle(req);

      if (!res) {
        throw new Error('Invalid');
      }
    }

    console.log('Service handler...');
  }
}

(() => {
  const service = new Service();

  service.middlewares(
    new AuthenticationHandler(),
    new AuthorizationHandler(),
    new ActivateHandler(),
  );

  service.handle();
})();
