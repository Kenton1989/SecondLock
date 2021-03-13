import { api } from "./api.js";

/**
 * A class of object that can be call remotely.
 *
 * For example, calling a method of object at the backend
 * from the front end.
 */
class RemoteCallable {
  static doNothing(arg) {}

  #name = undefined;

  /**
   * Create a remote callable of given name.
   *
   * @param {(String|undefined)} name the name of the remote callable.
   * If it is undefined or empty string, the object cannot be called remotely.
   */
  constructor(name) {
    // Avoid redundancy if the name is not set.
    if (!name) return;
    this.#name = name;

    // avoid ambiguity of "this"
    let obj = this;

    api.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message.remoteCallInfo) {
        let callInfo = message.remoteCallInfo;
        if (callInfo.targetName != obj.name) return;

        let funcName = callInfo.funcName;
        let args = callInfo.args;
        let res = obj[funcName](...args);

        if (res instanceof Promise) {
          res.then(function (result) {
            sendResponse({ ret: result });
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
    return this.#name;
  }

  /**
   * Call a method of the given remote callable object.
   *
   * @param {String} name name of the remote object
   * @param {String} funcName name of the function to be called
   * @param {any[]} args parameter list
   * @returns {Promise} the promise resolved with the value return by remote method
   */
  static call(name, funcName, args = []) {
    let remoteCallQuery = {
      remoteCallInfo: {
        targetName: name,
        funcName: funcName,
        args: args,
      },
    };
    return api.runtime.sendMessage(remoteCallQuery).then((reply) => reply.ret);
  }
}

/**
 * equivalent function to RemoteCallable.call
 */
function remoteCall(name, funcName, args = []) {
  return RemoteCallable.call(name, funcName, args);
}

export { RemoteCallable, remoteCall };
