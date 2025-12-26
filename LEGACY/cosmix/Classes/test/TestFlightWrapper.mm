


//  TestFlightWrapper.mm
//
//  Created by haxpor on 4/9/13.
//
//

#include "TestFlightWrapper.h"
#include "TestFlight.h"

namespace TestFlightWrapper {
    
    //static const char* TFOptionAttachBacktraceToFeedback_utf8String = [TFOptionAttachBacktraceToFeedback UTF8String];
    static const char* TFOptionDisableInAppUpdates_utf8String = [TFOptionDisableInAppUpdates UTF8String];
    static const char* TFOptionLogToConsole_utf8String = [TFOptionLogToConsole UTF8String];
    static const char* TFOptionLogToSTDERR_utf8String = [TFOptionLogToSTDERR UTF8String];
    static const char* TFOptionReinstallCrashHandlers_utf8String = [TFOptionReinstallCrashHandlers UTF8String];
    static const char* TFOptionSendLogOnlyOnCrash_utf8String = [TFOptionSendLogOnlyOnCrash UTF8String];
    
    static TestFlightWrapper *s_testFlightWrapper;
    
    TestFlightWrapper::TestFlightWrapper()
    {
        
    }
    
    TestFlightWrapper::~TestFlightWrapper()
    {
        
    }
    
    TestFlightWrapper* TestFlightWrapper::sharedWrapper()
    {
        if(!s_testFlightWrapper)
        {
            s_testFlightWrapper = new TestFlightWrapper();
        }
        
        return s_testFlightWrapper;
    }
    
    void TestFlightWrapper::addCustomEnvironmentInformation(const char *information, const char *key)
    {
        [TestFlight addCustomEnvironmentInformation:[NSString stringWithUTF8String:information] forKey:[NSString stringWithUTF8String:key]];
    }
    
    void TestFlightWrapper::takeOff(const char* applicationToken)
    {
        [TestFlight takeOff:[NSString stringWithUTF8String:applicationToken]];
    }
    
    void TestFlightWrapper::passCheckpoint(const char* checkpointName)
    {
        [TestFlight passCheckpoint:[NSString stringWithUTF8String:checkpointName]];
    }
    
    void TestFlightWrapper::openFeedbackView()
    {
//        [TestFlight openFeedbackView];
    }
    
    void TestFlightWrapper::submitFeedback(const char* feedback)
    {
        [TestFlight submitFeedback:[NSString stringWithUTF8String:feedback]];
    }
    
    void TestFlightWrapper::setDeviceIdentifier(const char* deviceIdentifier)
    {
        [TestFlight setDeviceIdentifier:[NSString stringWithUTF8String:deviceIdentifier]];
    }
    
    void TestFlightWrapper::log(const char *strFormat, ...)
    {
        va_list ap;
        va_start(ap, strFormat);
        TFLog([NSString stringWithUTF8String:strFormat], ap);
        va_end(ap);
    }
    
} // end of TestFlightWrapper