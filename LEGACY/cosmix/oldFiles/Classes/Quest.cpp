#include "Quest.h"
#include "LevelLoader.h"

 vector<Quest*> Quest::quests;

Quest::Quest(	int _type, int _count, string _description, string _levelFileName,
             int _actType, int _actValue, string _actDescript){

    type            = _type;
    count           = _count;
    description     = _description;
    levelFileName   = _levelFileName;
    actType         = _actType;
    actValue        = _actValue;
    actDescript     = _actDescript;
	
	//CCUserDefault::sharedUserDefault()->getIntegerForKey( "value", 0 );
}


Quest::~Quest(void)
{
}

/// init and load qusts data
void Quest::initQuests(){
    Quest::quests.clear();
    /// load quests
    Quest::quests = LevelLoader::getInstance()->getCurLevelPack()->quests;
}

int Quest::typeByName(string strType){
    if (strType == "LEARNING" ) {
        return QT_LEARNING;
    }else if (strType == "POINTS") {
        return QT_POINTS;
    }else if (strType == "COINS") {
        return QT_COINS;
    }else if (strType == "SUPERCOMBO") {
        return QT_SUPERCOMBO;
    }else if (strType == "MEGACOMBO") {
        return QT_MEGACOMBO;
    }else if (strType == "COSMOCOMBO") {
        return QT_COSMOCOMBO;
    }else if (strType == "LEVEL") {
        return QT_LEVEL;
    }else if (strType == "USE_GRENADE") {
        return QT_USE_GRENADE;
    }else if (strType == "USE_ROCKET") {
        return QT_USE_ROCKET;
    }else if (strType == "USE_MEGABOMB") {
        return QT_USE_MEGABOMB;
    }else if (strType == "USE_BUBBLE") {
        return QT_USE_BUBBLE;
    }
    return -1;
    
}

int Quest::actionTypeByName(string strType){
    if (strType == "ADD_COINS" ) {
        return UT_ADD_COINS;
    }else if (strType == "SET_DIFFICULT") {
        return UT_SET_DIFFICULT;
    }else if (strType == "SET_POINT_MULTIPLY") {
        return UT_SET_POINT_MULTIPLY;
    }else if (strType == "NOTHING") {
        return UT_NOTHING;
    }
    return -1;
}

