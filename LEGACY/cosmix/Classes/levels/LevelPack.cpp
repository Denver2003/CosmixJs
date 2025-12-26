
#include "LevelPack.h"

//---------
LevelPack::LevelPack(string _label,string _name)
{
    label           = _label;
    name            = _name;
    //curLevelIndex   = -1;
    multiplier      = 1;

}
//---------
LevelPack::~LevelPack(void)
{
}

Level * LevelPack::getLevelByName( string _name )
{
    map<string, Level *>::iterator it = levels.find( _name );
    if (it != levels.end()) {
        return it->second;
    }
    return NULL;
}

//---------
void LevelPack::addLevel(Level * level)
{
    if (!getLevelByName(level->name)) {
        levels.insert(make_pair(level->name, level));
        level->parent = this;
    }
}


Quest * LevelPack::getCurQuest()
{
    if (currentQuestIndex < 0) {
        currentQuestIndex = 0;
    }
    
    if ( currentQuestIndex >= quests.size()) {
        currentQuestIndex = quests.size()-1;
    }
    if (quests.size() > 0) {
        return quests[currentQuestIndex];
    }
    return NULL;
}

Level * LevelPack::getCurLevel()
{
    Quest * quest = getCurQuest();
    if (quest) {
        Level * level = getLevelByName( quest->levelFileName );
        return level;
    }
    return NULL;
    
    
    /*if (curLevelIndex < 0 || curLevelIndex > levels.size() ) {
        curLevelIndex = 0;

        if (levels.size() == 0) {
            return NULL;
        }
    }
    return levels[curLevelIndex];
     */
}

Level * LevelPack::moveToNextLevel(){
    
    getCurLevel();
    /*
    curLevelIndex++;
    if (curLevelIndex < levels.size() ) {
        return getCurLevel();
    }
     */
    return NULL;
    
}