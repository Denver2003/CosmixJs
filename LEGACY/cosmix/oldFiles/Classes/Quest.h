#ifndef boltrix_Quest_h
#define boltrix_Quest_h

#include "cocos2d.h"

#define QT_LEARNING		0
#define QT_POINTS		1
#define QT_COINS		2
#define QT_SUPERCOMBO	3
#define QT_MEGACOMBO	4
#define QT_COSMOCOMBO	5
#define QT_LEVEL		6
#define QT_USE_GRENADE	7
#define QT_USE_ROCKET	8
#define QT_USE_MEGABOMB	9
#define QT_USE_BUBBLE   10

#define UT_NOTHING              0
#define UT_ADD_COINS            1
#define UT_SET_DIFFICULT        2
#define UT_SET_POINT_MULTIPLY   3

//CC_USE_NS
using namespace cocos2d;
using namespace std;



class Quest
{
public:
	Quest(	int _type, int _count, string _description, string _levelFileName,
		int _actType, int _actValue, string _actDescript);
	~Quest(void);
	int type;
	int count;
	string name;
	string description;
	int multiplier;
    

	string levelFileName;

	/// if quest is complete, make next changes
	int			actType;
	int			actValue;
	string		actDescript;

	

	/// static variables
	static vector<Quest*> quests;

	static void initQuests();
    static int typeByName(string strType);
    static int actionTypeByName(string strType);    
    
    
	//static Quest * helpQuest;

	
};

#endif