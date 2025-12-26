//
//  params.h
//  boltrix
//
//  Created by Den on 04.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_params_h
#define boltrix_params_h
#include "cocos2d.h"

#define SAVE_INT(key,value) CCUserDefault::sharedUserDefault()->setIntegerForKey(key,value)
#define LOAD_INT(key,value,default) value=CCUserDefault::sharedUserDefault()->getIntegerForKey(key,default)
#define SAVE_STR(key,value) CCUserDefault::sharedUserDefault()->setStringForKey(key,value)
#define LOAD_STR(key,value,default) value=CCUserDefault::sharedUserDefault()->getStringForKey(key,default)
#define SAVE_FLOAT(key,value) CCUserDefault::sharedUserDefault()->setFloatForKey(key,value)
#define LOAD_FLOAT(key,value,default) value=CCUserDefault::sharedUserDefault()->getFloatForKey(key,default)
#define FLASH CCUserDefault::sharedUserDefault()->flush()

using namespace cocos2d;

class params
{
private:
    params();
    ~params();
    static params * instance;
public:
    /*
    - макс. кол-во очков(таблица из 10 значений)
    - общее кол-во сокращенных фигур за все время
    - общее кол-во супер комбо
    - общее кол-во мега комбо
    - общее кол-во космокомбо
     */
    int localHIScores[10];
    int hiScore;
    int hiCoinsPerLevel;
    int hiFiguresClearedPerLevel;
    int allFiguresCleared;
    int allComboSuper;
    int allComboMega;
    int allComboCosmo;
    
    void loadAll();
    void saveAll();
    
    
    
    static params * getInstance();
    static  void destroyInstance();    

    
};

#endif
