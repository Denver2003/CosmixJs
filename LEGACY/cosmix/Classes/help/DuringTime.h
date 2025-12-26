//
//  DuringTime.h
//  cosmix
//
//  Created by Denis Khlopin on 26.09.13.
//
//

#ifndef __cosmix__DuringTime__
#define __cosmix__DuringTime__

#include "LevelHelperLoader.h"

#define DURINGTYPE_DURING 0 /*сделать что то Н раз за отрезок времени*/
#define DURINGTYPE_WAITING 1 /*удерживать что то в течении времени*/

class DuringTime : public  cocos2d::CCObject
{
protected:
    DuringTime(int _type = DURINGTYPE_DURING);
    ~DuringTime();
public:
    float duration;
    float currentTick;
    std::vector<float> counts;
    bool started;
    bool isReached;
    int reachCount;
    int type;
    
    float currentDuration;
    bool isWaiting;
    
    SEL_CallFuncO onDoneFunc;
    CCObject * onDoneHandler;
    
    void setDoneFunction(CCObject * _onDoneHandler,SEL_CallFuncO _onDoneFunc);
    void clear();
    void start();
    void stop();
    void upd(float dt);
    void add();
    void remove();
    void removeAll();
    int getCount();
    
    void setType(int _type);
    //static
    static void updateDuring(float dt);
    static std::vector<DuringTime *> duringTimes;
    static DuringTime * createDuringTime(float _duration,int _count,int _type = DURINGTYPE_DURING);
    static void destroyDuringTime(DuringTime * dt);
    
};
#endif /* defined(__cosmix__DuringTime__) */
