//
//  Level.h
//  boltrix
//
//  Created by Den on 06.05.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_LevelLoader_h
#define boltrix_LevelLoader_h
//#include "Bonus.h"
#include "cocos2d.h"
#include "Quest.h"
#include "LevelPack.h"
#include "Level.h"
#include "Stage.h"
#include "Figure.h"
#include "QuestItem.h"



using namespace cocos2d;

using namespace std;

//#define lpCCDICTONARY CCDictionary<std::string, CCObject*>*
#define lpCCDICTONARY CCDictionary*

#define CCDICTONARY CCDictionary
#define STR_FROM_DICT(dict,name) ((CCString *)dict->objectForKey(name))->getCString()
#define INT_FROM_DICT(dict,name) ((CCString *)dict->objectForKey(name))->intValue()
#define DICT_FROM_DICT(dict,name) ((lpCCDICTONARY)dict->objectForKey(name))
#define FLOAT_FROM_DICT(dict,name) ((CCString *)dict->objectForKey(name))->floatValue()


/*#define CCDICTONARY CCDictionary<std::string, CCObject*>
#define STR_FROM_DICT(dict,name) ((CCString *)dict->objectForKey(name))->toStdString()
#define INT_FROM_DICT(dict,name) ((CCString *)dict->objectForKey(name))->toInt()
#define DICT_FROM_DICT(dict,name) ((lpCCDICTONARY)dict->objectForKey(name))
#define FLOAT_FROM_DICT(dict,name) ((CCString *)dict->objectForKey(name))->toFloat()
*/





class Bonus;

class LevelLoader{
public:
    LevelLoader();
    ~LevelLoader();
    
    LevelPack * getCurLevelPack();
    Level * getCurLevel();
    Stage * getCurStage();

    void initNewLevel(); // init level
    bool toNextStage(); // make a next stage
    bool checkToNextStage(); // check points to next
    bool readyToNextStage(); // check points to next    
    bool figuresClear( int count, int tag=-1 );
    void makeNextLevel();
    
    bool addCleared( int _count );
    bool addPoints( int _points );
    int getStars();


public:
///static     

    static LevelLoader * getInstance();
    
    void loadLevelData();
    
//    string getNextLevel();
//    bool setNextLevel();
    
    map<string, LevelPack *> levelPacks;
    
    LevelPack * curLevelPack;
	int         curStageIndex;
    int         curStageNumber;
    int         stageFiguresCleared;
    int         stageCurrentPoints;

    bool        bLevelComplete;
    
    
    LevelPack * getLevelPack(string name);
    
	static vector<string> parseParams(string params, char delim=',');
    static vector<int> parseParamsInt(string params, char delim=',');
    
    LevelPack *  loadLevelPack( lpCCDICTONARY dict, string name);
    vector<Quest *> loadQuests(lpCCDICTONARY dictQuests);
    vector<Level *> loadLevels(lpCCDICTONARY dictLevels);
    map<int, ccColor3B> loadColors(lpCCDICTONARY dictColors);
    vector<Stage *> loadStages(lpCCDICTONARY dictLevel, Level * level);
    vector<Bonus *> loadBonuses(lpCCDICTONARY dictBonuses);
    

     void loadLevelPacksFromFile();

private:    
    static LevelLoader * glLevelLoader;
    
};
#endif
