#include "Laser.h"
#include "Game.h"
#include "AliensManager.h"
#include "sounds.h"
#include "Test.h"


Laser::Laser(void)
{
	sprite					= NULL;
	laserType				= -1;
	needType				= LASER_STAY;
    timeToGameOver          = TIME_GAME_OVER;
    isWaitingGameOver       = false;
	getSpriteFromLoader();
	setType(LASER_STAY);
    snd                   = 0;

}


Laser::~Laser(void)
{
	CCNotificationCenter::sharedNotificationCenter()->
		removeObserver(this,LHAnimationHasEndedAllRepetitionsNotification);
}

void Laser::getSpriteFromLoader()
{
	if( Game::getLoader() ){
		CCSize winSize             = CCDirector::sharedDirector()->getWinSize();

		sprite = Game::getLoader()->spriteWithUniqueName( "lightning" );
		LHSprite * tmpSprite = Game::getLoader()->spriteWithUniqueName("laserPoint");
		if (tmpSprite) {
			laserPoint = tmpSprite->getPosition();
			tmpSprite->removeSelf();
			rectGameOver.origin.x = 0;
			rectGameOver.origin.y = laserPoint.y;
			rectGameOver.size.width = winSize.width;
			rectGameOver.size.height = 1;
		}

        CCNotificationCenter::sharedNotificationCenter()->
			addObserver(
				this,
				callfuncO_selector( Laser::laserEndAnim ),
				LHAnimationHasEndedAllRepetitionsNotification,
				sprite
			);

	}
}

void Laser::setType(int type)
{
	if( type == -1){
		if(needType == laserType){
			return;
		}

		laserType = needType;
	}else{
		laserType = type;
	}

	switch( laserType ){
		case LASER_FIND:
			if(sprite){
				sprite->prepareAnimationNamed( "laser_find", "sprites.pshs" );
				sprite->playAnimation();
			}
			break;
		case LASER_STAY:
			if(sprite){
				sprite->prepareAnimationNamed( "laser_wait", "sprites.pshs" );
				sprite->playAnimation();
			}
			break;
		case LASER_KILL:
			if(sprite){
				sprite->prepareAnimationNamed( "laser_loop", "sprites.pshs" );
				sprite->playAnimation();
			}
			break;
		case LASER_PREKILL:
			if(sprite){
				sprite->prepareAnimationNamed( "laser_start", "sprites.pshs" );
				sprite->playAnimation();
			}
			break;
	}
}

void Laser::setNeedType(int type)
{
	needType = type;
}

int Laser::calcPercentToKill()
{
    // 100 - TIME_GAME_OVER
    //   x - timeToGameOver
    return 100 - (int)((100 * timeToGameOver) / TIME_GAME_OVER);
}

bool Laser::updateLaser(float dt)
{
	if( AliensManager::getInstance()->rectCollideWhithSprites( rectGameOver ))
	{
		if (laserType != LASER_FIND && laserType != LASER_PREKILL) {
            int percent = calcPercentToKill();
            if( (CCRANDOM_0_1() * 100) > percent  ){
                setNeedType( LASER_FIND );
            }else{
                setNeedType( LASER_PREKILL );
            }
		}
			
		if( !isWaitingGameOver ){
			isWaitingGameOver	= true;
			timeToGameOver		= TIME_GAME_OVER;
		}
	}else{
		isWaitingGameOver = false;

        if (snd>0) {
            //stops emergency sound of game over
            sound::getInstance()->stopSound(snd);
            snd = 0;
        }
	}


	if( isWaitingGameOver ){
		timeToGameOver = timeToGameOver - dt;
        
        //starts emergency sound of game over if it is needed
        if ( snd==0 && (TIME_GAME_OVER - timeToGameOver) > TIME_TO_START_SOUND ) {
            snd = sound::getInstance()->playFirstSound("last_chance");
        }
        
		if( timeToGameOver < 0 ){
			/// need to call Game Over Function
			setType(LASER_KILL);
            if (snd>0) {
                //stops emergency sound of game over
                sound::getInstance()->stopSound(snd);
            }
            snd=0;
			return true;
		}
	}


	setType();

	return false;
}

        /*if (laserType != LASER_FIND) {
         laserType = LASER_FIND;
         if (laserSprite) {
         laserSprite->prepareAnimationNamed( "laser_find", "laser.pshs" );
         laserSprite->playAnimation();
         CCNotificationCenter::sharedNotificationCenter()->addObserver(
         this,
         callfuncO_selector( GameScene::laserEndAnim ),
         LHAnimationHasEndedNotification,
         laserSprite
         );
         }
         }
         */
 /*       
        //if( gameOverCollisions.size() > 0 ){
		if( !isWaitingGameOver ){
			isWaitingGameOver = true;
			timeToGameOver = TIME_GAME_OVER;
            
		}
	}else{
		isWaitingGameOver = false;
	}
    
	if( isWaitingGameOver ){
		timeToGameOver = timeToGameOver - dt;
		if( timeToGameOver < 0 ){
			isGameOver = true;
			/// need to call Game Over Function
            laserType = LASER_KILL;
            if (laserSprite) {
                laserSprite->prepareAnimationNamed( "laser_kill", "laser.pshs" );
                laserSprite->playAnimation();
            }
			gameOver();
		}
	}
	
	//----------------------------------------------------------

 
}
*/
///---------------------------------------------------------------------------------
void Laser::laserEndAnim(CCObject * object)
{
	TESTLOG("GameScene::laserEndAnim(CCObject * object)");
	
    LHSprite * sp = (LHSprite *)object;
	string animationName = "";
	if(sp)
	{
		animationName = sp->animationName();
	}else
	{
		return;
	}

    if (sp == sprite) {
		if(animationName == "laser_find" ){
			setNeedType( LASER_STAY );
		}
		if(animationName == "laser_start" ){
			setNeedType( LASER_STAY );
		}
	}
}
