#ifndef __cosmix__AliensManager__
#define __cosmix__AliensManager__

#include "Alien.h"



class AliensManager
{
public:

	// create aliens
	Alien * createAlien			(Figure * _figure);
	Alien * createAlien			(Alien * _childAlien);
	Alien * createShadowAlien	(Figure * _figure);
	Alien * createShadowAlien	(Alien * _childAlien);
    
	Alien * createPhysicsAlien	(Figure * _figure, bool addToPool = true);
	Alien * createPhysicsAlien	(Alien * _childAlien, bool addToPool = true);
    void addToPool	(Alien * alien);
    bool isInPool(Alien * alien);


	Alien * createNextAlien	(Figure * _figure);

	void removeAlien( Alien * alien );
	void removeAlienBySprite( LHSprite * _sprite );
	
    Alien * alienBySprite( LHSprite * _sprite );

	void updatePositions();
    
	void collide( LHSprite * spriteA, LHSprite * spriteB );
	void uncollide( LHSprite * spriteA, LHSprite * spriteB );
    

    void preCalculate();
    void calcGroup(Alien * alien, int groupId);
    void calculate();
    void updateTime( float tick );
    vector<Alien *>  aliensByGroup(int groupId);
    void setClearByGroup(int groupId);
    void setClearByColor(int tag, int count = 4);
    int getCountByTag(int tag);
    Figure * getMaxFiguresOnLevel();
    
    void removeCollidedSprite();
	void removeAllSprite(bool clear = false);
	bool	rectCollideWhithSprites(CCRect rc);
    
    bool checkTouchToKill(CCPoint touchPoint);
    bool checkGunShot(CCPoint touchPoint);
    
    int maxColorOfAliens();

    
    

    map<LHSprite *, Alien *> aliensBySprites;
	map<Alien *, int> physicsAliens;

public:	
	static AliensManager * getInstance();
	static void destroyInstance();




private:
	AliensManager(void);
	~AliensManager(void);
	 
	static AliensManager * instance;
	
};

#endif 