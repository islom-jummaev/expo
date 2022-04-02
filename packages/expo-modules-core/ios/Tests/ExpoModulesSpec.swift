// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

class ExpoModulesSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext.create()
    let interopBridge = SwiftInteropBridge(appContext: appContext)
    let runtime = appContext.runtime
    let testModuleName = "TestModule"

    beforeSuite {
      try! appContext.installExpoModulesHostObject(interopBridge)

      appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
        $0.name(testModuleName)
      })
    }

    describe("global.ExpoModules") {
      it("is defined") {
        expect(runtime?.evaluateScript("'ExpoModules' in this")) === true
      }

      it("has native module defined") {
        expect(runtime?.evaluateScript("'\(testModuleName)' in ExpoModules")) === true
      }

      it("can access native module") {
        expect(runtime?.evaluateScript("ExpoModules.\(testModuleName)")) !== nil
      }

      it("has registered modules in keys") {
        let registeredModuleNames = appContext.moduleRegistry.getModuleNames()
        expect(runtime?.evaluateScript("Object.keys(ExpoModules)") as? [String]).to(contain(registeredModuleNames))
      }
    }
  }
}
