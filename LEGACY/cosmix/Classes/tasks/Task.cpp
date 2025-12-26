//
//  Task.cpp
//  cosmix
//
//  Created by denver on 03.09.13.
//
//

#include "Task.h"
#include "PlayEvents.h"
#include "TaskManager.h"
#include <stdio.h>
#include <stdlib.h>

CTask::CTask(int _type)
{
    type            = _type;
    
    initValue1      = 0;
    currentValue1   = 0;
    reachValue1     = 0;
    initValue2      = 0;
    currentValue2   = 0;
    reachValue2     = 0;
    text            = "";

    unique          = -1;
    done            = false;
    failed          = false;
    unique          = 0;
    isCleared       = false;
    taskInfo        = NULL;
    price           = 0;
    taskInfo        = NULL;
    level           = 0;
    canPass         = false;
    countToPass     = 3;
    delay           = 1;
    award           = 0;
}

CTask::~CTask()
{
    
}
void CTask::beforeGame()
{
    done            = false;
    failed          = false;
    init();
    canPass = false;
    
    if (taskCountInGame > countToPass) {
        canPass = true;
    }
    if (countToPass==0) {
        canPass = false;
    }

}
void CTask::afterGame()
{
    taskCountInGame++;
    save();
    onEndGame();
}

bool CTask::check(void)
{
    if ((currentValue1 >= reachValue1) && !done && (reachValue1>0)) {
        if( setDone() )
        {

        }
    }

    return done;
}

void CTask::taskIsDone(void)
{
    /*isCleared       = true;
    if (unique > 0) {
        char taskNumber[20];
        sprintf(taskNumber, "cleared%i",unique);
        CCUserDefault::sharedUserDefault()->setIntegerForKey(taskNumber,1);
    }
*/
    //увеличение
}
//сохранение данных о уровне
void CTask::save(void)
{
    if (unique<0) {
        return;
    }
    char saveIdent[25];
    sprintf(saveIdent, "isCleared_%i",unique);
    CCUserDefault::sharedUserDefault()->setBoolForKey(saveIdent,isCleared);
    sprintf(saveIdent, "taskCountInGame_%i",unique);
    CCUserDefault::sharedUserDefault()->setIntegerForKey(saveIdent,taskCountInGame);
    CCUserDefault::sharedUserDefault()->flush();
    
}
//загрузка данных о уровне
void CTask::load(void)
{
    if (unique<0) {
        return;
    }
    char saveIdent[25];
    sprintf(saveIdent, "isCleared_%i",unique);
    isCleared = CCUserDefault::sharedUserDefault()->getBoolForKey(saveIdent,false);
    sprintf(saveIdent, "taskCountInGame_%i",unique);
    taskCountInGame = CCUserDefault::sharedUserDefault()->getIntegerForKey(saveIdent,0);
    
}

void CTask::init(void)
{
    setInitValue1(0);
    setInitValue2(0);
}
void CTask::onEndGame(void)
{
}

void CTask::initOnce(void)
{
}

void CTask::setInitValue1(int _val)
{
    initValue1      = _val;
    currentValue1   = _val;
}

void CTask::setInitValue2(int _val)
{
    initValue2      = _val;
    currentValue2   = _val;
}

void CTask::addValue1(int _val)
{
    currentValue1+=_val;
    check();
}

void CTask::addValue2(int _val)
{
    currentValue2+=_val;
}

void CTask::clearValue1(void)
{
    currentValue1=initValue1;
}

void CTask::clearValue2(void)
{
    currentValue2=initValue2;
}

bool CTask::isReached1(void)
{
    if ( currentValue1 >= reachValue1 ) {
        return true;
    }
    return false;
}
bool CTask::isReached2(void)
{
    if ( currentValue2 >= reachValue2 ) {
        return true;
    }
    return false;
}

bool CTask::setDone(void)
{
    if (!failed&&!done) {
        done = true;
        isCleared = true;
        PlayEvents::getInstance()->onTaskIsDone(this);
        save();
        return true;
    }
    return false;
}
bool CTask::setFailed(void)
{
    if (!done&&!failed) {
        failed = true;
        PlayEvents::getInstance()->onTaskIsFailed(this);
        save();        
        return true;
    }
    return false;
}

void CTask::setText(std::string _text)
{
    text = "";
    bool nextKeyChar = false;
    std::string tail = "";
    char temp[13];
    
    for (int i = 0; i < _text.size(); i++) {
        char ch = _text[i];
        if (nextKeyChar) {
            if (ch == 'n') {
                tail = "\n";
            }else
            if(ch == '1') {
                sprintf(temp, "%i",reachValue1);
                tail = std::string(temp);
            }else
            if(ch == '2') {
                sprintf(temp, "%i",reachValue2);
                tail = std::string(temp);
            }else
            if(ch == '3') {
                if (reachValue2<1 || reachValue2>8) {
                    reachValue2 = 1;
                }
                sprintf(temp, "%s", CTaskManager::getInstance()->colorNames[reachValue2].c_str() );
                    tail = std::string(temp);
            }else{
                i--;
            }
            text = text + tail;
            tail = "";
            nextKeyChar = false;
            
        }else{
            if (ch == '\\') {
                tail = ch;
                nextKeyChar = true;
                
            }else if(ch == '%'){
                tail = ch;
                nextKeyChar = true;
            }else{
                text = text + ch;
            }
        }
        
    }
}

std::string CTask::getText(void)
{
    return text;
}

