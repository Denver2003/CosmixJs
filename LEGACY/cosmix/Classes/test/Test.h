//
//  Test.h
//  cosmix
//
//  Created by denver on 17.02.14.
//
//
#define _TEST_

#ifndef __cosmix__Test__
#define __cosmix__Test__
#include "cocos2d.h"

#ifdef _TEST_
#define TESTLOG(format, ...) Test::getInstance()->Log(format, ##__VA_ARGS__)
#define TESTLOGFLIGHT(format, ...) Test::getInstance()->LogFlight(format, ##__VA_ARGS__)
#define TESTCHECKPOINT(point) Test::getInstance()->Checkpoint(point)
#endif

USING_NS_CC;
using namespace std;
class Test : public CCObject{
public:
    static Test *getInstance();
    
    
    void takeOff();
    /* void setOptions(NSDictionary* options); */ // we don't support yet!
    void Checkpoint(string checkpointName);
    void Feedback(string feedback);
    //void log(const char *strFormat, ...);
    void Log(const char * pszFormat, ...);
    void LogFlight(const char * pszFormat, ...);
    
private:
    Test();
    ~Test();
    static Test * instance;
};


#endif /* defined(__cosmix__Test__) */
