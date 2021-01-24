/**
 * A class of object that can be call remotely.
 *
 * For example, calling a method of object at the backend
 * from the front end.
 */
class RemoteCallable {
  static doNothing(...args) {}

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

    chrome.runtime.onMessage.addListener(function (
      message,
      sender,
      sendResponse
    ) {
      if (message.remoteCallInfo) {
        let callInfo = message.remoteCallInfo;
        if (callInfo.targetName != obj.name) return;
        let funcName = callInfo.funcName;
        let args = callInfo.args;
        let ret = obj[funcName](...args);
        sendResponse({ ret: ret });
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
   * @param {function(any)} callOnReturn callback on function return.
   *    The parameter will be the value returned by the called function
   */
  static call(
    name,
    funcName,
    args = [],
    callOnReturn = RemoteCallable.doNothing
  ) {
    chrome.runtime.sendMessage(
      {
        remoteCallInfo: {
          targetName: name,
          funcName: funcName,
          args: args,
        },
      },
      function (val) {
        callOnReturn(val.ret);
      }
    );
  }
}

/**
 * Call a method of the given remote callable object.
 *
 * @param {String} name name of the remote object
 * @param {String} funcName name of the function to be called
 * @param {any[]} args parameter list
 * @param {function(any)} callOnReturn callback on function return.
 *    The parameter will be the value returned by the called function
 */
function remoteCall(
  name,
  funcName,
  args = [],
  callOnReturn = RemoteCallable.doNothing
) {
  RemoteCallable.call(name, funcName, args, callOnReturn);
}

export { RemoteCallable, remoteCall };
