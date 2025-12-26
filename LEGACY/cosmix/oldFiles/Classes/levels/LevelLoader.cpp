//
//  Level.cpp
//  boltrix
//
//  Created by Den on 06.05.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

//#include <iostream>
//using namespace std;


#include "LevelLoader.h"
#include "GameScene.h"
#include "Loader.h"
#include "Bonus.h"


LevelLoader * LevelLoader::glLevelLoader;

LevelLoader::LevelLoader(){
    curLevelPack = NULL;
    curStageIndex = -1;
    curStageNumber = 0;
	stageCurrentPoints = 0;
	CCLOG("LevelLoader::LevelLoader()");
    
}

LevelLoader::~LevelLoader(){
	CCLOG("LevelLoader::~LevelLoader()");  
}

LevelLoader * LevelLoader::getInstance(){
    if (!glLevelLoader) {
		CCLOG("LevelLoader::getInstance: create new instance"); 

        glLevelLoader = new LevelLoader();
        glLevelLoader->loadLevelData();
        glLevelLoader->curLevelPack = glLevelLoader->getLevelPack("LevelPack1");
		
    }
    return glLevelLoader;
}

LevelPack * LevelLoader::getLevelPack(string name){

    map<string, LevelPack *>::iterator it = levelPacks.find(name);
    if (it != levelPacks.end()) {
		CCLOG("LevelLoader::getLevelPack: level pack is founded(%s)",name.c_str());
        return it->second;
    }
	CCLOG("LevelLoader::getLevelPack: level pack not found %s",name.c_str());
    return NULL;
}

void LevelLoader::loadLevelPacksFromFile()
{
    CCLOG("LevelLoader::loadLevelPacksFromFile()");
    
    //CCDictionary<std::string, CCObject*> * dict             = NULL;
	CCDictionary * dict = NULL;

	string fullPath = CCFileUtils::sharedFileUtils()->fullPathFromRelativePath("level.plist");
	//CCFileUtils::sharedFileUtils()->
	
    dict =  CCDictionary::createWithContentsOfFile( fullPath.c_str() );
	//CCFileUtils::sharedFileUtils()->dictionaryWithContentsOfFile( fullPath.c_str()  );
    LevelPack * levelPack =loadLevelPack( dict, "LevelPack11" );
    if (levelPack) {
        levelPacks.insert( make_pair( levelPack->name, levelPack ) );        
    }

    
}

///-------------------------------------
LevelPack * LevelLoader::loadLevelPack(lpCCDICTONARY dict, string name)
{
    if (!dict) {
        return NULL;
    }
    
    LevelPack * levelPack = NULL;

    string packName = STR_FROM_DICT(dict, "name");
    string label = STR_FROM_DICT(dict, "label");
    
    levelPack = new LevelPack(label, packName);
    
    
    
    /// load quests
	lpCCDICTONARY dictQuests    = NULL;
    dictQuests = DICT_FROM_DICT( dict, "quests" );//(lpCCDICTONARY) dict->objectForKey("quests");
    if (dictQuests) {
        levelPack->quests = loadQuests(dictQuests);
    }
	lpCCDICTONARY dictLevels = DICT_FROM_DICT( dict, "levels" );
	if(dictLevels){
		vector<Level *> levels = loadLevels( dictLevels );
		for(int i = 0; i < levels.size(); i++ ){
			levelPack->addLevel( levels[i] );
		}
	}

    
    
    return levelPack;
}

vector<Quest *> LevelLoader::loadQuests(lpCCDICTONARY dictQuests)
{
    vector<Quest *> quests;
    
    
    if (dictQuests) {
        lpCCDICTONARY dictQuest    = NULL;
        int questCount = 1;
        char questLabel[30];
        sprintf(questLabel, "quest%i", questCount );
        dictQuest = (lpCCDICTONARY) dictQuests->objectForKey( questLabel );
        while ( dictQuest ) {
            string  Descript    = STR_FROM_DICT(dictQuest, "descript" );
            string  Type        = STR_FROM_DICT(dictQuest, "type" );
            int     Count       = INT_FROM_DICT(dictQuest, "count" );
            string  actType     = STR_FROM_DICT(dictQuest, "actionType" );
            int     actValue    = INT_FROM_DICT(dictQuest, "actionValue" );
            string  actDescript = STR_FROM_DICT(dictQuest, "actionDescript" );
            string  levelName   = STR_FROM_DICT(dictQuest, "levelName" );
            int  multiplier     = INT_FROM_DICT(dictQuest, "multiplier" );
            
            Quest * quest = new Quest(Quest::typeByName(Type), Count, Descript, levelName, Quest::actionTypeByName(actType), actValue, actDescript);
            quest->multiplier = multiplier;
            
            quests.push_back(quest);
            //----------
            questCount++;
            sprintf(questLabel, "quest%i", questCount );
            dictQuest = (lpCCDICTONARY) dictQuests->objectForKey( questLabel );
        }
    }
    return quests;
}
//-----------------------------
vector<Level *> LevelLoader::loadLevels(lpCCDICTONARY dictLevels)
{
    vector<Level *> levels;
    if (dictLevels) {
        lpCCDICTONARY dictLevel    = NULL;
        int levelCount = 1;
        char levelLabel[30];
        
        sprintf(levelLabel, "level%i", levelCount );
        dictLevel = (lpCCDICTONARY) dictLevels->objectForKey( levelLabel );
        while ( dictLevel ) {
			string scene = STR_FROM_DICT( dictLevel, "scene" );
			
			Level * level = new Level( levelLabel, scene, levelLabel );

            lpCCDICTONARY dictColors = DICT_FROM_DICT(dictLevel, "colors");
			level->colors = loadColors( dictColors );   

			vector<Stage *> stages = loadStages( dictLevel, level );
            for (unsigned int i = 0; i < stages.size(); i++) {
                level->addStage(stages[i]);
            }
            
            lpCCDICTONARY dictBonuses = DICT_FROM_DICT(dictLevel, "bonuses");
            level->bonuses = loadBonuses( dictBonuses );
            
            levels.push_back(level);
            
            //----------
            levelCount++;
            sprintf(levelLabel, "level%i", levelCount );
			dictLevel = (lpCCDICTONARY) dictLevels->objectForKey( levelLabel );
        }
        
    }
    return levels;
    
}

map<int, ccColor3B> LevelLoader::loadColors(lpCCDICTONARY dictColors)
{
    map<int, ccColor3B> colors;
    if (dictColors) {
        //vector< string > tags = dictColors->allKeys();
		CCArray * tags = dictColors->allKeys();
		if( tags ){

			for (unsigned int i = 0; i < tags->count(); i++ ) {
				string curTag = ((CCString *)tags->objectAtIndex(i))->getCString(); 
				int tag = atoi( curTag.c_str());
				if (tag > 0) {
					string color = STR_FROM_DICT(dictColors, curTag );
					vector<int> colorParts = LevelLoader::parseParamsInt(color);
					if (colorParts.size() == 3) {
	                    ccColor3B col3B;
		                col3B.r = colorParts[0];
			            col3B.g = colorParts[1];
				        col3B.b = colorParts[2];
					    tag         = TAG_FROM + tag;
						colors.insert(make_pair(tag, col3B));
					}
				} 

			}
        }
    }

    return colors;
}

 vector<Stage *> LevelLoader::loadStages(lpCCDICTONARY dictLevel, Level * level){
	 vector<Stage *> stages;
	 	 if(dictLevel){
		lpCCDICTONARY dictStage    = NULL;
        int stageCount = 1;
        char stageLabel[30];
		sprintf( stageLabel, "stage%i", stageCount );
		dictStage = DICT_FROM_DICT( dictLevel, stageLabel );
		while(dictStage){
			int bonusTime			= INT_FROM_DICT( dictStage, "bonusTime" );
			string figureColors		= STR_FROM_DICT( dictStage, "figureColors" );
			vector<int> colors		= LevelLoader::parseParamsInt( figureColors );
			string figureTypes		= STR_FROM_DICT( dictStage, "figureTypes" );
			vector<string> types	= LevelLoader::parseParams( figureTypes );
			int points				= INT_FROM_DICT( dictStage, "points" );
			int rotateAngle			= INT_FROM_DICT( dictStage, "rotateAngle" );
			string starsList		= STR_FROM_DICT( dictStage, "stars" );
			vector<int> stars		= LevelLoader::parseParamsInt( starsList );
			float waitingTime		= FLOAT_FROM_DICT( dictStage, "waitingTime" );

			if(stars.size() == 3 ){
				Stage * stage = new Stage(stageLabel,waitingTime,points,stars[0],stars[1],stars[2],rotateAngle,bonusTime);
				
				for(int iColors = 0; iColors < colors.size(); iColors++){
					for(int iTypes = 0; iTypes < types.size(); iTypes++){
						int tag         = TAG_FROM + colors[iColors];
						string spriteName = types[iTypes];
						Figure * figure = new Figure( spriteName, spriteName, tag, 1, level->getColor(tag));
                        stage->addFigure(figure);
					}
				}
                
                stages.push_back(stage);
			}
            
			stageCount ++;
			sprintf( stageLabel, "stage%i", stageCount );
			dictStage = DICT_FROM_DICT( dictLevel, stageLabel );
		}
	 }
	 return stages;
 }

vector<Bonus *>  LevelLoader::loadBonuses(lpCCDICTONARY dictBonuses)
{
    vector<Bonus *> bonuses;
    
    if (dictBonuses) {
        
        CCArray * bonusNames = dictBonuses->allKeys();
		if(bonusNames){

				for (unsigned int i = 0; i < bonusNames->count(); i++) {
					string bonusName = ((CCString *) bonusNames->objectAtIndex(i))->getCString();
					int type = Bonus::typeByName(bonusName);
					if (type != -1) {
						Bonus * bonus = new Bonus( type );
					
						lpCCDICTONARY dictBonus = DICT_FROM_DICT(dictBonuses, bonusName );
                
						float coolDown = FLOAT_FROM_DICT(dictBonus, "cooldown" );
						bonus->coolDownTime = coolDown;
			        
						lpCCDICTONARY percentByFigureCountDict = DICT_FROM_DICT(dictBonus, "percentByFigureCount");
						if (percentByFigureCountDict) {
							CCArray * pbfcNames = percentByFigureCountDict->allKeys();
							if(pbfcNames){
								for (int j = 0;  j < pbfcNames->count(); j++) {
									string pbfcName	= ((CCString *) pbfcNames->objectAtIndex(j))->getCString();
									int cnt         = atoi(pbfcName.c_str());
									int percent     = INT_FROM_DICT(percentByFigureCountDict, pbfcName );
									bonus->percentByFigureCount.insert(make_pair(cnt, percent));
								}
							}
						}

						lpCCDICTONARY percentByLevelDict = DICT_FROM_DICT(dictBonus, "percentByLevel");
						if (percentByLevelDict) {
							CCArray * pbfcNames = percentByLevelDict->allKeys();
							if(pbfcNames){
								for (int j = 0;  j < pbfcNames->count(); j++) {
									string pbfcName = ((CCString *) pbfcNames->objectAtIndex(j))->getCString();
									int cnt         = atoi(pbfcName.c_str());
									int percent     = INT_FROM_DICT(percentByLevelDict, pbfcName );
									bonus->percentByLevel.insert(make_pair(cnt, percent));
								}
							}
						}
						bonuses.push_back( bonus );
					}///type
				}
		}
    }
    
    return bonuses;
}


void LevelLoader::loadLevelData(){
    loadLevelPacksFromFile();
    return;
	/*CCLOG("LevelLoader::loadLevelData()");
    
	string fullPath = CCFileUtils::fullPathFromRelativePath("levels.plist");
    CCLOG("LevelLoader::loadLevelData: path=%s",fullPath.c_str());

    CCDictionary<std::string, CCObject*> * dict             = NULL;
    CCDictionary<std::string, CCObject*> * dictLevelPack    = NULL;
    CCDictionary<std::string, CCObject*> * dictLevels       = NULL;    
    CCDictionary<std::string, CCObject*> * dictLevel        = NULL;                        
    CCDictionary<std::string, CCObject*> * dictStage        = NULL;                            
    CCDictionary<std::string, CCObject*> * dictFigures      = NULL;    
    CCDictionary<std::string, CCObject*> * dictTypes        = NULL;    
    CCDictionary<std::string, CCObject*> * dictTypeTags     = NULL;        
	CCDictionary<std::string, CCObject*> * dictColors       = NULL; 
	CCDictionary<std::string, CCObject*> * dictTagsColors   = NULL; 
	CCDictionary<std::string, CCObject*> * dictTagsColorColor   = NULL;
    dict =  CCFileUtils::dictionaryWithContentsOfFile( fullPath.c_str()  );
    
    if( dict!=NULL ){
        vector<string> levelPackNames = dict->allKeys(); //загружаем левелпаки
        for (int i = 0; i < levelPackNames.size(); i++) {
            string pack = levelPackNames[i];
            
            dictLevelPack = (CCDictionary<std::string, CCObject*> *) dict->objectForKey( pack.c_str() );
            if (dictLevelPack) {
                CCString * packName = (CCString *)dictLevelPack->objectForKey("name");
                if (packName) {
                    
                    //создаем левелпак в памяти
                    LevelPack * levelPack = new LevelPack( pack, packName->toStdString() );
                    
                    dictLevels = (CCDictionary<std::string, CCObject*> *) dictLevelPack->objectForKey( "levels" );
                    if (dictLevels) {
                        
                        /// search levels from 1
                        int levelCount = 1;
                        char levelLabel[30];
                        sprintf( levelLabel, "level%i", levelCount );
                        dictLevel = (CCDictionary<std::string, CCObject*> *)dictLevels->objectForKey(levelLabel);

                        while ( dictLevel ) {
                            /// разбор ветки level1
                            CCString * sceneFile = (CCString *)dictLevel->objectForKey("scene"); //имя файла левелхелпера
                            CCString * levelName = (CCString *)dictLevel->objectForKey("name");// имя уровня
                            /// проверка на достоверность уровня
                            if ( sceneFile && levelName ) {
                                Level * level = new Level(levelLabel, sceneFile->toStdString(),levelName->toStdString());
                                /// разбор ветки colors(связка цветов и тегов)
                                dictColors = (CCDictionary<std::string, CCObject*> *)dictLevel->objectForKey("colors");
								
								if( dictColors ){
									vector<string> tagColorNames = dictColors->allKeys();
									for (int iTagColors = 0; iTagColors < tagColorNames.size(); iTagColors++) {
										string tagColorLabel = tagColorNames[iTagColors];
										dictTagsColorColor = (CCDictionary<std::string, CCObject*> *)dictColors->objectForKey(tagColorLabel);
										int tag         = TAG_FROM + atoi(tagColorLabel.c_str());
										if( dictTagsColorColor ){
											int r = 0, g = 0, b = 0;
											if (dictTagsColorColor->objectForKey("r")) 
												r = ((CCString *)dictTagsColorColor->objectForKey("r"))->toInt();
                                            if (dictTagsColorColor->objectForKey("g")) 
                                                g = ((CCString *)dictTagsColorColor->objectForKey("g"))->toInt();
                                            if (dictTagsColorColor->objectForKey("b")) 
                                                b = ((CCString *)dictTagsColorColor->objectForKey("b"))->toInt();

											level->addColor( tag, r, g, b );


										}
									}
								}

                                /// разбор ветки stage1
                                int stageCount = 1;
                                char stageLabel[30];
                                sprintf(stageLabel, "stage%i", stageCount);
                                dictStage = (CCDictionary<std::string, CCObject*> *)dictLevel->objectForKey(stageLabel);
                                while (dictStage ) {
                                    ///
                                    float waitingTime = 0.0;
                                    if (dictStage->objectForKey("waiting_time") != NULL) {
                                        waitingTime = ((CCString *)dictStage->objectForKey("waiting_time"))->toFloat();
                                    }
                                    int points = 0;
                                    if (dictStage->objectForKey("points") != NULL) {
                                        points = ((CCString *)dictStage->objectForKey("points"))->toInt();
                                    }
                                    int starOne = 0;
                                    if (dictStage->objectForKey("starOne") != NULL) {
                                        starOne = ((CCString *)dictStage->objectForKey("starOne"))->toInt();
                                    }
                                    int starTwo = 0;
                                    if (dictStage->objectForKey("starTwo") != NULL) {
                                        starTwo = ((CCString *)dictStage->objectForKey("starTwo"))->toInt();
                                    }
                                    int starThree = 0;
                                    if (dictStage->objectForKey("starThree") != NULL) {
                                        starThree = ((CCString *)dictStage->objectForKey("starThree"))->toInt();
                                    }
                                    int userLevel = 0;
                                    if (dictStage->objectForKey("userLevel") != NULL) {
                                        userLevel = ((CCString *)dictStage->objectForKey("userLevel"))->toInt();
                                    }
                                    
                                    
                                    /// проверка на достоверность стадии
                                    if ( ( waitingTime > 0 ) && ( points > 0 ) ) {
                                        Stage * stage = new Stage( stageLabel, waitingTime, points, starOne, starTwo, starThree, userLevel,180 );
                                        
                                        dictFigures = (CCDictionary<std::string, CCObject*> *)dictStage->objectForKey("figures");
                                        if (dictFigures) {
                                            vector<string> typeNames = dictFigures->allKeys();
                                            for (int iType = 0; iType < typeNames.size(); iType++ ) {
                                                string typeLabel = typeNames[iType]; /// имя спрайта!!!!
                                                dictTypes = (CCDictionary<std::string, CCObject*> *)dictFigures->objectForKey(typeLabel);
                                                if (dictTypes) {
                                                    vector<string> tagNames = dictTypes->allKeys();
                                                    for (int iTags = 0; iTags < tagNames.size(); iTags++) {
                                                        string tagLabel = tagNames[iTags];
                                                        int tag         = TAG_FROM + atoi(tagLabel.c_str());
                                                        dictTypeTags    = (CCDictionary<std::string, CCObject*> *)dictTypes->objectForKey(tagLabel);
                                                        if (dictTypeTags) {
                                                            int count;
															if (dictTypeTags->objectForKey("count")) 
																count = ((CCString *)dictTypeTags->objectForKey("count"))->toInt();
															Figure * figure = new Figure( typeLabel, typeLabel, tag, count, level->getColor(tag));
                                                            stage->addFigure(figure);
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if (stage->figures.size()>0) {
                                            level->addStage(stage);
                                        }else {
                                            delete stage;
                                        }
                                    }//( ( waitingTime > 0 ) && ( points > 0 ) ) 

                                    
                                    ///
                                    stageCount++;
                                    sprintf(stageLabel, "stage%i", stageCount);
                                    dictStage = (CCDictionary<std::string, CCObject*> *)dictLevel->objectForKey(stageLabel);
                                }// while(dictStage)
                                
                                if (level->stages.size() > 0) {
                                    levelPack->addLevel(level);                                    
                                }else {
                                    delete level;
                                    level   =   NULL;
                                }

                                
                            }// if ( sceneFile && levelName )
                            
                            ////
                            levelCount++;
                            sprintf( levelLabel, "level%i", levelCount );
                            dictLevel = (CCDictionary<std::string, CCObject*> *)dictLevels->objectForKey(levelLabel);
                            
                        }//while
                        
                    }// if (dictLevels)
                    levelPacks.insert(make_pair(levelPack->label, levelPack ));
                }//if (packName)                 
            }
        }
    }
    */
    
}

LevelPack * LevelLoader::getCurLevelPack(){
    if (!curLevelPack) {
        curLevelPack = glLevelLoader->getLevelPack("LevelPack1");
    }
    return curLevelPack;
}

Level * LevelLoader::getCurLevel(){
    if (getCurLevelPack()) {
        return getCurLevelPack()->getCurLevel();
    }
    return NULL;
}

Stage * LevelLoader::getCurStage(){
    if (getCurLevelPack()) {
        Level * lvl = getCurLevel();
        if (!lvl) {
			CCLOG("LevelLoader::getCurStage can't find current level!");
            return NULL;
        }
        if (curStageIndex >=0 && curStageIndex < lvl->stages.size() ) {
            //CCLOG("LevelLoader::getCurStage get stage number: %i",curStageIndex);
			return lvl->stages[ curStageIndex ];
        }
		
		CCLOG("LevelLoader::getCurStage wrong index = %i",curStageIndex);
        return NULL;
    }
    return NULL;
}


//------------------------
/// begin new level
void LevelLoader::initNewLevel(){
    curStageIndex       = 0;
    curStageNumber      = 1;
    bLevelComplete      = false;
    stageFiguresCleared = 0;
	CCLOG("LevelLoader::initNewLevel");
}
//------------------------
// if return true - next stage success - if return false - no next stage! level complete
bool LevelLoader::toNextStage(){
	CCLOG("LevelLoader::toNextStage");
    Level * lvl = getCurLevel();
    if (!lvl) {
		CCLOG("LevelLoader::toNextStage not found current level");
        return false;
    }
    
	
    curStageIndex++;
    curStageNumber++;
    stageFiguresCleared = 0;
    stageCurrentPoints  = 0;
    
	CCLOG("LevelLoader::toNextStage curStageIndex = %i, curStageNumber = %i level.stages.size()= %i ",
		curStageIndex,curStageNumber,lvl->stages.size());

    if (curStageIndex >= lvl->stages.size() ) {
		int prevStageIndex = lvl->stages.size() - 1;
        /// create new stage!!!!!!!!!!!!
        ///!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		CCLOG("LevelLoader::toNextStage create new stage! lastIndex = %i", prevStageIndex);
		if( (prevStageIndex >=0 ) && ( prevStageIndex < lvl->stages.size())){
			Stage * currStage = lvl->stages[prevStageIndex];
			if( currStage ){
				Stage * newStage = Stage::cloneStage(currStage, NULL );
				if( newStage ){
					lvl->stages.push_back(newStage);
					
					CCLOG("LevelLoader::toNextStage creating new stage = OK");
					return true;
				}
				CCLOG("LevelLoader::toNextStage error of creating newStage");
				return false;
			}
			CCLOG("LevelLoader::toNextStage error of getting currStage");
			return false;
		
		}else{
			
			CCLOG("LevelLoader::toNextStage error prevStageIndex = %i", prevStageIndex);
		}
        

        //bLevelComplete = true;
        return false;
        
    }
    return true;
}
//------------------------
bool LevelLoader::checkToNextStage( ){
    Stage * stg = getCurStage();
	if(!stg){
		CCLOG( "checkToNextStage: NOT FOUND CURRENT STAGE!" );
		return false;
	}
    if (stg) {
        if ( stageFiguresCleared >= stg->points ) {
			CCLOG("LevelLoader::checkToNextStage go to next level! stageFiguresCleared = %i,  stg->points = %i"
				,stageFiguresCleared, stg->points);

            toNextStage();
            return true;
        }
    }
    return false;
}


//------------------------
bool LevelLoader::readyToNextStage( ){
    Stage * stg = getCurStage();
    if (stg) {
        if ( stageFiguresCleared >= stg->points ) {
			CCLOG("LevelLoader::readyToNextStage ready to go to next level! stageFiguresCleared = %i,  stg->points = %i"
				,stageFiguresCleared, stg->points);

            return true;
        }
    }
    return false;
}

void LevelLoader::makeNextLevel(){
    LevelPack * lp = getCurLevelPack();
    if (lp) {
        lp->moveToNextLevel();
    }
}
//string Level::getNextLevel(){
//}

//bool Level::setNextLevel(){
//}

int LevelLoader::getStars(){
    Stage * stg = getCurStage();
	if(!stg){
		CCLOG("LevelLoader::getStars no stage error!!!!");
		return 0;
	}
    
   if (stageCurrentPoints >= stg->starThree) {
	   CCLOG("LevelLoader::getStars 3");
       return 3;
   }else if( stageCurrentPoints >= stg->starTwo ){
	   CCLOG("LevelLoader::getStars 2");
       return 2;
   }else if( stageCurrentPoints >= stg->starOne ){
	   CCLOG("LevelLoader::getStars 1");
       return 1;
   }
   CCLOG("LevelLoader::getStars 0");
   return 0;
}
//------
bool LevelLoader::addCleared( int _count ){
    Stage * stg = getCurStage();
    if(!stg){
		CCLOG( "addCleared: NOT FOUND CURRENT STAGE!" );
		return false;
	}
    stageFiguresCleared += _count;
    if (stageFiguresCleared > stg->points) {
		
		CCLOG("LevelLoader::addCleared go to next level! stageFiguresCleared = %i,  stg->points = %i"
				,stageFiguresCleared, stg->points);

        GameScene::gameScene->preNewStage();
        checkToNextStage();
        GameScene::gameScene->afterNewStage();
        return true;
    }
    return false;
}
//------
bool LevelLoader::addPoints( int _points ){
    stageCurrentPoints += _points;
	CCLOG("LevelLoader::addPoints add %i points! total on stage: %i points",_points,stageCurrentPoints);
    return true;
}

//----------------------------------------------------------------

vector<string> LevelLoader::parseParams(string params, char delim){
    vector<string> result;
    string param = "";
    for (unsigned int i=0; i < params.size(); i++) {
        char ch = params[i];
        if( ch == delim ){
            result.push_back(param);
            param = "";
        }else {
            param = param + ch;
        }
    }
    if (!param.empty()) {
        result.push_back(param);
    }
    
    return result;
}
//----------------------------------------------------------------
vector<int> LevelLoader::parseParamsInt(string params, char delim){
    vector<string> strResult = parseParams(params,delim);
    vector<int> result;
    for (unsigned int i=0; i < strResult.size(); i++  ) {
        int value = atoi( strResult[i].c_str() );
        result.push_back(value);
    }
    return result;
}
