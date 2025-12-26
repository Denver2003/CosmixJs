//
//  Stage.h
//  Boltrix
//
//  Created by Den on 19.03.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef Boltrix_Stage_h
#define Boltrix_Stage_h

#include "cocos2d.h"
#include "Loader.h"

USING_NS_CC;

using namespace std;

#define TAG_FIGURES_START 1000
#define TAG_BONUSES_START 5000

class CFigure;
///----------------------
class CStage{
public:
    vector< CFigure * > figures;
    int pointToNextLevel;
    float waitingTime;
    
    bool isLastStage;
    
    CStage();
    ~CStage();

    map<string, CFigure*> figureBySprite;

    ///----static------
    
    static CStage *         stageFromDict( CCDictionary* dict );
    static void             clearStages(void);
    static CStage *         currentStage();
    static bool             nextStage();
    static bool             checkPoints(int currPoints);
    static CFigure *        randomFigure();
    static int              addFigureTag(int tag);
    
    static int              stageIndex;
    static int              tagCount;
    static vector<CStage*>  stages;
    static map<int, int>    uniqueFigureTags;

};
///----------------------///----------------------///----------------------///----------------------
class CFigure{
public:
    int         tag;
    string      spriteName;
    bool        isBonus;
    
    CFigure();
    ~CFigure();
    
    
};



#endif
