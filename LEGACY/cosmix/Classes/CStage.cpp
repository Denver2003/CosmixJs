//
//  Stage.cpp
//  Boltrix
//
//  Created by Den on 19.03.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include "CStage.h"

int                 CStage::tagCount       = 100001;
vector<CStage*>     CStage::stages;
int                 CStage::stageIndex     = 0;
map<int, int>       CStage::uniqueFigureTags;



CStage::CStage(){
    isLastStage = false;
}

CStage::~CStage(){

    figureBySprite.clear();
    
    for( vector<CFigure*>::iterator It= figures.begin(); It != figures.end(); It++ ){
        if( *It != NULL ){
			CFigure * figure = *It;
            delete figure;
            figure=NULL;
        }
    }
    figures.clear();
}

CStage * CStage::stageFromDict( CCDictionary * dict ){

    CStage * stage = new CStage();
    
    
    CCDictionary * figuresDict = (CCDictionary *)dict->objectForKey("figures");  
    if (figuresDict!=NULL) {
		CCArray * figureKeys = figuresDict->allKeys();
        for (int i = 0; i < figureKeys->count(); i++ ) {
			string key = ((CCString *)figureKeys->objectAtIndex(i))->getCString();
            CCDictionary * typeDict = 
                (CCDictionary *)figuresDict->objectForKey(key);  
            if (typeDict!=NULL) {
                
                CCString * spriteTag = (CCString*)typeDict->objectForKey("type");
                CCArray  * spritesDict = (CCArray *)typeDict->objectForKey("sprites");
                if (spritesDict!=NULL) {
                    for (int j=0;  j!=spritesDict->count(); j++) {

                        CCString * sprite = (CCString *) spritesDict->objectAtIndex(j);
                        if (sprite!=NULL) {
                            CFigure * figure    = new CFigure();
                            figure->spriteName  = sprite->getCString();
                            if (spriteTag!=NULL) {
                                figure->tag     = spriteTag->intValue() + TAG_FIGURES_START;
                                addFigureTag(figure->tag);
                            }
                            figure->isBonus     = false;
                            stage->figureBySprite.insert(make_pair(figure->spriteName, figure));
                            stage->figures.push_back(figure);
                        }
                        
                    }
                }
                //CCObject * obj = dict->objectForKey("points");
				stage->pointToNextLevel = ((CCString *)dict->objectForKey("points"))->intValue();
                stage->waitingTime      = ((CCString *)dict->objectForKey("waiting_time"))->floatValue();
                
            }
        }
    }
    stages.push_back(stage);
    return stage;
}

void CStage::clearStages(void){
    
    for( vector<CStage*>::iterator It= CStage::stages.begin(); It != CStage::stages.end(); It++ ){
        if( *It != NULL ){
			CStage * stage = *It;
            delete stage;
			stage = NULL;
        }
    }
    stages.clear();
    CStage::tagCount        = 100001;
    CStage::stageIndex      = 0;
    uniqueFigureTags.clear();
    srand(time(NULL));
    CCRANDOM_0_1();
    
}

CStage * CStage::currentStage(){
    if (stages.size()>0) {
        if (stageIndex>=0 && stageIndex<stages.size()) {
            return stages[stageIndex];
        }
    }
    return NULL;
}

bool CStage::nextStage(){
    if (stageIndex<stages.size()-1) {
        stageIndex++;
        return true;
    }
    return false;
}

bool CStage::checkPoints(int currPoints){
    if (currentStage()!=NULL) {
        if (currPoints>=currentStage()->pointToNextLevel && !currentStage()->isLastStage) {
            if( !nextStage() ){
                currentStage()->isLastStage = true;
                return true;
            }
        }
    }
    return false;
}

CFigure * CStage::randomFigure(){
    int rIndex = 0;
    int maxIndex = CStage::currentStage()->figures.size();
    rIndex = CCRANDOM_0_1() * maxIndex;
    CFigure * figure = CStage::currentStage()->figures[rIndex];
    return figure;
}

int CStage::addFigureTag(int tag){
    map<int, int>::iterator it = uniqueFigureTags.find(tag);
    if (it==uniqueFigureTags.end()) {
        uniqueFigureTags.insert(make_pair(tag, 1));
        return 1;
    }else{
        it->second++;
        return it->second;
    }
}

///----------------------///----------------------///----------------------///----------------------

CFigure::CFigure(){
    
}

CFigure::~CFigure(){
    
}
