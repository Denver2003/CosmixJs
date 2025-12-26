//
//  params.cpp
//  boltrix
//
//  Created by Den on 04.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "params.h"
#include "LevelLoader.h"

params * params::instance = NULL;

params::params()
{
    
    for (int i = 0; i < 10 ; i++) {
            localHIScores[i] = 0;
    }

    hiScore = 0;
    hiCoinsPerLevel = 0;
    hiFiguresClearedPerLevel = 0;
    allFiguresCleared = 0;
    allComboSuper = 0;
    allComboMega = 0;
    allComboCosmo = 0;
    
    loadAll();
}

params::~params()
{
    saveAll();
}

void params::loadAll()
{
    for ( int i = 0; i < 10; i++ ) {
        char name[30];
        sprintf(name, "score%i", i );
        localHIScores[i] = CCUserDefault::sharedUserDefault()->getIntegerForKey(name);
    }
    
    hiScore                     = CCUserDefault::sharedUserDefault()->getIntegerForKey("hiScore");
    hiCoinsPerLevel             = CCUserDefault::sharedUserDefault()->getIntegerForKey("hiCoinsPerLevel");
    hiFiguresClearedPerLevel    = CCUserDefault::sharedUserDefault()->getIntegerForKey("hiFiguresClearedPerLevel");
    allFiguresCleared           = CCUserDefault::sharedUserDefault()->getIntegerForKey("allFiguresCleared");
    allComboSuper               = CCUserDefault::sharedUserDefault()->getIntegerForKey("allComboSuper");
    allComboMega                = CCUserDefault::sharedUserDefault()->getIntegerForKey("allComboMega");
    allComboCosmo               = CCUserDefault::sharedUserDefault()->getIntegerForKey("allComboCosmo");
    
    map<string, LevelPack *>::iterator it = LevelLoader::getInstance()->levelPacks.begin();
    for (;it != LevelLoader::getInstance()->levelPacks.end(); it++) {
        char key[50];
        sprintf(key, "currentQuestIndex%s", it->first.c_str() );
        LevelPack * lp = it->second;
        lp->currentQuestIndex = CCUserDefault::sharedUserDefault()->getIntegerForKey(key);
    }
        
    
}

void params::saveAll()
{
    for ( int i = 0; i < 10; i++ ) {
        char name[30];
        sprintf(name, "score%i", i );
        CCUserDefault::sharedUserDefault()->setIntegerForKey(name, localHIScores[i] );
    }

    CCUserDefault::sharedUserDefault()->setIntegerForKey("hiScore",hiScore);
    CCUserDefault::sharedUserDefault()->setIntegerForKey("hiCoinsPerLevel",hiCoinsPerLevel);
    CCUserDefault::sharedUserDefault()->setIntegerForKey("hiFiguresClearedPerLevel",hiFiguresClearedPerLevel);
    CCUserDefault::sharedUserDefault()->setIntegerForKey("allFiguresCleared",allFiguresCleared);
    CCUserDefault::sharedUserDefault()->setIntegerForKey("allComboSuper",allComboSuper);
    CCUserDefault::sharedUserDefault()->setIntegerForKey("allComboMega",allComboMega);
    CCUserDefault::sharedUserDefault()->setIntegerForKey("allComboCosmo",allComboCosmo);
    
    
    CCUserDefault::sharedUserDefault()->flush();
}



///----- static ---------
params * params::getInstance()
{
    if (!params::instance) {
        params::instance = new params();
    }
    return params::instance;
}

void params::destroyInstance()
{
    if (params::instance) {
        delete params::instance;
        params::instance = NULL;
    }
}
