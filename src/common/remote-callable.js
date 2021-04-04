import { api } from "../common/api";

/**
 * A class of object that can be call remotely.
 *
 * For example, calling a method of object at the backend
 * from the front end.
 */
class RemoteCallable {
  static doNothing(arg) {}
  /**
   * Create a remote callable of given name.
   *
   * @param {(String|undefined)} name the name of the remote callable.
   * If it is undefined or empty string, the object cannot be called remotely.
   */
  constructor(name) {
    // Avoid redundancy if the name is not set.
    if (!name) return;
    this._name = name;

    // avoid ambiguity of "this"
    let obj = this;

    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.remoteCallInfo) {
        let callInfo = message.remoteCallInfo;
        if (callInfo.targetName !== obj.name) return;

        let { funcName, args, waitRet } = callInfo;

        if (!waitRet) {
          // run the function after sending the response
          // avoid unnecessary channel usage
          sendResponse(undefined);
          window.setTimeout(() => {
            obj[funcName](...args);
          }, 1);
          return;
        }
        
        let res = obj[funcName](...args);
        if (res instanceof Promise) {
          res
            .then((result) => {
              sendResponse({ ret: result });
            })
            .catch((err) => {
              console.error("Error during Remote Call: ", err);
            });
          // return true to keep message channel open until response is set
          return true;
        } else {
          sendResponse({ ret: res });
        }
      }
    });
  }

  /**
   * The name of the remote callable object.
   */
  get name() {
    return this._name;
  }

  /**
   * Call a method of the given remote callable object.
   *
   * @param {String} name name of the remote object
   * @param {String} funcName name of the function to be called
   * @param {any[]} args parameter list
   * @param {boolean} waitRet if true, the call will return a Promise that will resolve with
   *  the return from the remote callee. Otherwise, return a promise fulfilled with undefined.
   * @returns {Promise<*>} the promise resolved with the value return by remote method
   */
  static async call(name, funcName, args = [], waitRet = true) {
    let remoteCallQuery = {
      remoteCallInfo: {
        targetName: name,
        funcName: funcName,
        args: args,
        waitRet: waitRet,
      },
    };
    let prom = api.runtime.sendMessage(remoteCallQuery);
    if (waitRet) {
      let reply = await prom;
      return reply.ret;
    } else {
      return;
    }
  }
}

export default RemoteCallable;
