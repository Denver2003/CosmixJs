//
//  TaskManager.cpp
//  cosmix
//
//  Created by denver on 03.09.13.
//
//

#include "TaskManager.h"
#include "LevelLoader.h"
#include "Tasks.h"
#include "UserRating.h"
#include "Test.h"

CTaskManager * CTaskManager::theInstance = NULL;


void CTaskManager::loadListOfTasks()
{

    TESTLOG("CTaskManager::loadListOfTasks");
    
    std::string fullPath = CCFileUtils::sharedFileUtils()->fullPathFromRelativePath("tasks.plist");
	CCDictionary * dict = CCDictionary::createWithContentsOfFile( fullPath.c_str() );
    
    CCArray * arrayTasksInfo    = ARRAY_FROM_DICT(dict, "TasksInfo");
    CCArray * arrayTasksList    = ARRAY_FROM_DICT(dict, "TasksList" );
    //CCArray * arrayRatings      = ARRAY_FROM_DICT(dict, "Ratings" );
    CCArray * arrayTutorials    = ARRAY_FROM_DICT(dict, "Tutorials" );
    CCArray * arrayColorNames   = ARRAY_FROM_DICT(dict, "ColorNames" );
    
    //
    //UserRating::getInstance()->loadRatingNames(arrayRatings);
    
    lpCCDICTONARY dictTaskInfo = NULL;
    lpCCDICTONARY dictTaskList = NULL;
    CCObject * dummy;
    
    tutorialLabels.clear();
    CCARRAY_FOREACH(arrayTutorials, dummy){
        CCString * str = dynamic_cast<CCString *>(dummy);
        if (str) {
            tutorialLabels.push_back(str->getCString());
        }
    }
    
    colorNames.clear();
    CCARRAY_FOREACH(arrayColorNames, dummy){
        CCString * str = dynamic_cast<CCString *>(dummy);
        if (str) {
            colorNames.push_back(str->getCString());
        }
    }
    //загрузка списка типовых задач
    CCARRAY_FOREACH(arrayTasksInfo, dummy){
        dictTaskInfo            = dynamic_cast<lpCCDICTONARY>(dummy);
        if (dictTaskInfo) {
            int id                  = CTasks::taskIdByNameTasks(STR_FROM_DICT(dictTaskInfo,"id"));
            std::string taskText    = STR_FROM_DICT(dictTaskInfo, "text");//->getCString();
            if (id >= 0) {
                CTask * taskInfo = findTaskInfo(id);
                if (!taskInfo) {
                    taskInfo = new CTask(id);
                    taskInfo->text = taskText;
                    //заполняем шаблоны типовых задач
                    mapTasksInfo.insert(make_pair(id, taskInfo));
                }
            }
        }
    }
    int unique_id=0;
    //загрузка списка задач на выполнение
    CCARRAY_FOREACH(arrayTasksList, dummy){
        dictTaskList = dynamic_cast<lpCCDICTONARY>(dummy);
        if (dictTaskList) {
            int id                  = CTasks::taskIdByNameTasks(STR_FROM_DICT(dictTaskList,"TaskId"));
            CTask * taskInfo        = findTaskInfo(id);
            if (taskInfo) {
                int unique              = INT_FROM_DICT(dictTaskList,"unique");
                unique = unique_id;
                int value1              = INT_FROM_DICT(dictTaskList, "value1");
                int value2              = INT_FROM_DICT(dictTaskList, "value2");
                int price               = INT_FROM_DICT(dictTaskList, "price");
                int level               = INT_FROM_DICT(dictTaskList, "level");
                int countToPass         = INT_FROM_DICT(dictTaskList, "countToPass");
                int award               = INT_FROM_DICT(dictTaskList, "award");
                //set calc parameters
                int rat =UserRating::getInstance()->ratingByStars(unique_id + 1);
                switch (rat) {
                    case 0:
                        price       = 500;
                        countToPass = 10;
                        award       = 50;
                    break;
                    case 1:
                        price       = 500;
                        countToPass = 10;
                        award       = 50;
                        break;
                    case 2:
                        price       = 1000;
                        countToPass = 10;
                        award       = 100;
                        break;
                    case 3:
                        price       = 1500;
                        countToPass = 15;
                        award       = 150;
                        break;
                    case 4:
                        price       = 2000;
                        countToPass = 20;
                        award       = 200;
                        break;
                    case 5:
                        price       = 3000;
                        countToPass = 20;
                        award       = 300;
                        break;
                    case 6:
                        price       = 4000;
                        countToPass = 40;
                        award       = 400;
                        break;
                    case 7:
                        price       = 5000;
                        countToPass = 99;
                        award       = 500;
                        break;
                        
                    default:
                        break;
                }
                
                
                CTask * task = (CTask *)CTasks::createTask(taskInfo);
                if (task) {
                    task->taskInfo = taskInfo;
                    task->unique = unique;
                    task->setInitValue1(0);
                    task->setInitValue2(0);
                    task->reachValue1   = value1;
                    task->reachValue2   = value2;
                    task->price         = price;
                    task->level         = level;
                    task->countToPass   = countToPass;
                    task->award         = award;
                    task->setText( taskInfo->text );
                    
                    task->initOnce();
                    //UNCOMMENT TO RELEASE
                    //TEMP
                    task->load();

                    mapTasksList.insert(make_pair(unique, task));
                    sortedTasksList.push_back(task);
                    unique_id++;
                }
            }
        }
    }
    
//    dictTasksInfo->allKeys()->

}

void CTaskManager::loadCurrentTasks(void)
{
    TESTLOGFLIGHT("CTaskManager::loadCurrentTasks");
    //загрузка задач для текущего уровня
    int index = 0;
    isTutorialGame = false;
    
    currentTasks.clear();
    
    while ( index < sortedTasksList.size() && currentTasks.size() < TASK_COUNT_PER_GAME ) {
        if (!sortedTasksList[index]->isCleared /*&& sortedTasksList[index]->level <= UserRating::getInstance()->userLevel */) {
            
            sortedTasksList[index]->beforeGame();
            
            currentTasks.push_back(sortedTasksList[index]);
            if (sortedTasksList[index]->type == TASK_TO_LEARN) {
                isTutorialGame = true;
            }
            
                TESTCHECKPOINT("CURRENT TASK: " + sortedTasksList[index]->text);
        }
        index++;
    }
}


void CTaskManager::saveCurrentTasksOnGameOver(void)
{
    for (int i=0; i < currentTasks.size(); i++) {
        
        sortedTasksList[i]->afterGame();
        
    }
}

std::vector<CTask *> CTaskManager::getTasksByType(int type)
{
    std::vector<CTask *> tasks;
    for (int i=0; i < currentTasks.size(); i++) {
        if (currentTasks[i]->type == type) {
            tasks.push_back(currentTasks[i]);
        }
    }
    return tasks;
}

CTask * CTaskManager::findTaskInfo(int _id)
{
    std::map<int, CTask *>::iterator it = mapTasksInfo.find(_id);
    if (it != mapTasksInfo.end()) {
        return it->second;
    }
    return NULL;
}

std::string CTaskManager::updateText(std::string _text)
{
    std::string text = "";
    bool nextKeyChar = false;
    std::string tail = "";
   // char temp[13];
    
    for (int i = 0; i < _text.size(); i++) {
        char ch = _text[i];
        if (nextKeyChar) {
            if (ch == 'n') {
                tail = "\n";
            }else{
                        i--;
                    }
            text = text + tail;
            tail = "";
            nextKeyChar = false;
            
        }else{
            if (ch == '\\') {
                tail = ch;
                nextKeyChar = true;
                
            }else if(ch == '%'){
                tail = ch;
                nextKeyChar = true;
            }else{
                text = text + ch;
            }
        }
        
    }
    return text;
}


// static functions
CTaskManager * CTaskManager::getInstance(void)
{
    if (!CTaskManager::theInstance) {
        
        CTaskManager::theInstance = new CTaskManager();
        CTaskManager::theInstance->loadListOfTasks();
    }
    return CTaskManager::theInstance;
}

void CTaskManager::destroyInstance()
{
    if (!CTaskManager::theInstance) {
        delete CTaskManager::theInstance;
        CTaskManager::theInstance = NULL;
    }
    
}
CTaskManager::CTaskManager()
{
    
}
CTaskManager::~CTaskManager()
{
    
}
