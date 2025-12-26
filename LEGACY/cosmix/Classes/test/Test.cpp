//
//  Test.cpp
//  cosmix
//
//  Created by denver on 17.02.14.
//
//


#include "Test.h"
// if ios
#include "TestFlightWrapper.h"
//

Test * Test::instance = NULL;

Test * Test::getInstance()
{
    if (!Test::instance) {
        Test::instance = new Test();
    }
    return Test::instance;
}

Test::Test()
{
#ifdef _TEST_
    
#endif
}

Test::~Test()
{
    
}

void Test::takeOff()
{
#ifdef _TEST_
    //COSMIX APP TOKEN
    TestFlightWrapper::TestFlightWrapper::sharedWrapper()->takeOff("87fc7c1c-ddf2-4d73-8933-23e8056dc773");
#endif
}

void Test::Checkpoint(string checkpointName)
{
#ifdef _TEST_
    TestFlightWrapper::TestFlightWrapper::sharedWrapper()->passCheckpoint(checkpointName.c_str());
#endif
}

void Test::Feedback(string feedback)
{
   
#ifdef _TEST_
    TestFlightWrapper::TestFlightWrapper::sharedWrapper()->submitFeedback(feedback.c_str());
#endif
}

void Test::LogFlight(const char * pszFormat, ...)
{
#ifdef _TEST_
    //char szBuf[kMaxLogLen];
    
    va_list ap;
    va_start(ap, pszFormat);
    //    TFLog([NSString stringWithUTF8String:strFormat], ap);
    TestFlightWrapper::TestFlightWrapper::sharedWrapper()->log(pszFormat, ap);
    va_end(ap);
    
    
#else
    va_list ap;
    va_start(ap, pszFormat);
    CCLog(pszFormat, ap);
    va_end(ap);
    
#endif
}

void Test::Log(const char * pszFormat, ...)
{

    va_list ap;
    va_start(ap, pszFormat);
    CCLog(pszFormat, ap);
    va_end(ap);

}
