//
//  DuringTime.cpp
//  cosmix
//
//  Created by Denis Khlopin on 26.09.13.
//
//

#include "DuringTime.h"

std::vector<DuringTime *> DuringTime::duringTimes;

DuringTime::DuringTime(int _type)
{
    onDoneFunc = NULL;
    onDoneHandler = NULL;
    type            = _type;
}

DuringTime::~DuringTime()
{
    
}
void DuringTime::clear()
{
    currentTick     = 0;
    started         = false;
    counts.clear();
    isReached       = false;
    isWaiting       = false;
}

void DuringTime::start()
{
    started = true;
    isWaiting       = false;
}

void DuringTime::stop()
{
    started = false;
}

void DuringTime::upd(float dt)
{
    if (started) {
        currentTick += dt;

        if (type == DURINGTYPE_DURING) {
            
            for (std::vector<float>::iterator It=counts.begin(); It != counts.end(); It++) {
                if( (currentTick - *It) > duration ){
                    counts.erase(It);
                    break;
                }
            }
            
            if (counts.size() >= reachCount) {
                isReached = true;
                started = false;
                if (onDoneHandler && onDoneFunc) {
                    (onDoneHandler->*onDoneFunc)((CCObject*)this);
                }
            }
        }else if (type == DURINGTYPE_WAITING) {
            if ( counts.size() >= reachCount ) {
                if (!isWaiting) {
                    currentDuration = duration;
                    isWaiting = true;
                }
                currentDuration -= dt;
                
                if (currentDuration <= 0) {
                    isReached = true;
                    started = false;
                    if (onDoneHandler && onDoneFunc) {
                        (onDoneHandler->*onDoneFunc)((CCObject*)this);
                    }
                    
                }
                
            }else{
                isWaiting = false;
            }
        }
        
        
        
    }
}

void DuringTime::add()
{
    if (started) {
        counts.push_back(currentTick);
    }
    
}

void DuringTime::remove()
{
    if (started) {
        counts.pop_back();
    }
}

void DuringTime::removeAll()
{
    if (started) {
        counts.clear();
    }
}


int DuringTime::getCount()
{
    return counts.size();
}

void DuringTime::setType(int _type)
{
    type = _type;
}

//static
void DuringTime::updateDuring(float dt)
{
    for (std::vector<DuringTime*>::iterator It = DuringTime::duringTimes.begin(); It!=DuringTime::duringTimes.end(); It++) {
        DuringTime * during = *It;
        if (during) {
            during->upd(dt);
        }
    }
}

DuringTime * DuringTime::createDuringTime(float _duration,int _count,int _type )
{
    DuringTime * during = new DuringTime(_type);
    during->duration = _duration;
    during->reachCount = _count;
    during->clear();
    
    DuringTime::duringTimes.push_back(during);
    
    
    return during;
}

void DuringTime::destroyDuringTime(DuringTime * duringForDelete)
{
    for (std::vector<DuringTime*>::iterator It = DuringTime::duringTimes.begin(); It!=DuringTime::duringTimes.end(); It++) {
        DuringTime * during = *It;
        if (during == duringForDelete) {
            DuringTime::duringTimes.erase(It);
            break;
        }
    }
}

void DuringTime::setDoneFunction(CCObject * _onDoneHandler,SEL_CallFuncO _onDoneFunc)
{
    onDoneFunc      = _onDoneFunc;
    onDoneHandler   = _onDoneHandler;
}