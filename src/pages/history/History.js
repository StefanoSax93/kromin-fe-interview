import { createUseStyles } from 'react-jss'
import Container from '../../components/Container'
import Row from '../../components/Row'
import Column from '../../components/Column'
import TasksAPI from '../../http/task.http'
import useError from '../../hooks/useError'
import Spinner from '../../components/Spinner'
import { useEffect, useMemo, useState } from 'react'
import {
    dateIsInRange,
    historyRenderer,
    groupHistory,
    handleApiError,
    isBeforeToday,
} from '../../utilities/helpers'
import Task from '../../components/Task'
import HomeTableHeader from '../home/home-table-heading'
import FilterBar from '../home/filter-bar/FilterBar'
import { useWindowSize } from '../../hooks/useWindowSize'
import EditTaskModal from '../home/EditTaskModal'
import { TASK_MODEL } from '../../models'
import InfiniteScroll from 'react-infinite-scroll-component'

const useStyles = createUseStyles(theme => ({
    taskBodyRoot: {
        paddingTop: 0,
        height: `calc(${window.innerHeight}px - 184px)`,
        paddingBottom: 40,
        [theme.mediaQueries.lUp]: {
            paddingBottom: 16,
        },
    },
    section: {
        marginBottom: theme.spacing * 3,
    },
    sectionHeading: {
        display: 'block',
        margin: [theme.spacing * 3, 0, theme.spacing],
        fontSize: 14,
        fontWeight: 500,
        color: theme.palette.common.textBlack,
    },
    spinner: {
        textAlign: 'center',
        marginTop: 50,
    },
}))

const Completed = () => {
    const showError = useError()
    const [searchInput, setSearchInput] = useState('')
    const [tasks, setTasks] = useState(null)
    const [dateFilter, setDateFilters] = useState('')
    const [priority, setPriority] = useState(false)
    const [openedTask, setOpenedTask] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    const classes = useStyles()

    const { width } = useWindowSize()
    const isMobile = width < 600

    useEffect(() => {
        fetchTasks(1)
    }, [])

    const fetchTasks = async page => {
        try {
            const { data } = await TasksAPI.completedTasks(page)

            let newTasks = groupHistory(data.data)

            setTasks({ ...tasks, ...newTasks })

            setPage(page)

            if (data.current_page === data.last_page) {
                setHasMore(false)
            }
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }

    const onEditTask = async (oldTask, newTask) => {
        try {
            const { data } = await TasksAPI.editTask(newTask)
            onUpdateItem(oldTask, data)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }
    const onUpdateItem = (oldItem, updatedItem) => {
        let newTasks = tasks
        const isDateChanged =
            updatedItem[TASK_MODEL.date] !== oldItem[TASK_MODEL.date] &&
            !(
                isBeforeToday(oldItem[TASK_MODEL.date]) &&
                isBeforeToday(updatedItem[TASK_MODEL.date])
            )

        if (isDateChanged) {
            newTasks[oldItem[TASK_MODEL.date]] = newTasks[
                oldItem[TASK_MODEL.date]
            ].filter(task => task[TASK_MODEL.id] !== updatedItem[TASK_MODEL.id])

            if (updatedItem[TASK_MODEL.date] in newTasks) {
                newTasks[updatedItem[TASK_MODEL.date]].push(updatedItem)
            } else {
                newTasks[updatedItem[TASK_MODEL.date]] = [updatedItem]
            }
        } else {
            const taskToUpdateIndex = newTasks[
                updatedItem[TASK_MODEL.date]
            ].findIndex(
                task => task[TASK_MODEL.id] === updatedItem[TASK_MODEL.id]
            )
            newTasks[updatedItem[TASK_MODEL.date]][taskToUpdateIndex] =
                updatedItem
        }

        setTasks({ ...newTasks })
    }

    const onDeleteTask = async (task, index) => {
        try {
            await TasksAPI.deleteTask(task[TASK_MODEL.id])
            onDeleteItem(task[TASK_MODEL.date], index)
        } catch (error) {
            handleApiError({
                error,
                handleGeneralError: showError,
            })
        }
    }
    const onDeleteItem = (key, index) => {
        let newTasks = tasks
        //remember that key is => date
        //check if is Expired

        newTasks[key].splice(index, 1)

        setTasks({ ...newTasks })
    }

    const filteredTasks = useMemo(() => {
        const filtered = {}
        if (tasks) {
            Object.keys(tasks).forEach(date => {
                const filteredDate = tasks[date].filter(t => {
                    if (t.is_completed) {
                        const isInDate = dateFilter
                            ? dateIsInRange(
                                  t[TASK_MODEL.date],
                                  dateFilter?.[0],
                                  dateFilter?.[1]
                              )
                            : true
                        const isInSearch = searchInput
                            ? t[TASK_MODEL.description].includes(searchInput)
                            : true
                        const isInPriority = priority
                            ? t[TASK_MODEL.effort] === priority.value
                            : true
                        return isInDate && isInSearch && isInPriority
                    }
                })
                if (filteredDate.length) filtered[date] = filteredDate
            })
        }
        return filtered
    }, [tasks, dateFilter, searchInput, priority])

    return (
        <>
            <FilterBar
                onSearchHandler={setSearchInput}
                onDateChangeHandler={setDateFilters}
                dateFilter={dateFilter}
                onPriorityHandler={setPriority}
                route="/"
                routeName="To Do"
            />
            <HomeTableHeader />
            <Container className={classes.taskBodyRoot}>
                <Row>
                    <Column start={2} span={10}>
                        <InfiniteScroll
                            dataLength={filteredTasks.length || []}
                            next={() => fetchTasks(page + 1)}
                            hasMore={hasMore}
                            loader={
                                <div className={classes.spinner}>
                                    <Spinner />
                                </div>
                            }
                        >
                            {Object.keys(filteredTasks)?.map(date => (
                                <div className={classes.section}>
                                    <div
                                        key={date}
                                        className={classes.sectionHeading}
                                    >
                                        {historyRenderer(date)}
                                    </div>
                                    {filteredTasks[date]?.map((task, index) => (
                                        <Task
                                            task={task}
                                            index={index}
                                            isLast={
                                                tasks[date]?.length - 1 ===
                                                index
                                            }
                                            onDeleteCb={onDeleteTask}
                                            onUpdateCb={onEditTask}
                                            onEditCb={() => {
                                                setOpenedTask(task)
                                                setShowEditModal(true)
                                            }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </InfiniteScroll>
                    </Column>
                </Row>
            </Container>
            {showEditModal && !isMobile && (
                <EditTaskModal
                    onClose={() => {
                        setShowEditModal(false)
                    }}
                    task={openedTask}
                    onUpdateCb={onEditTask}
                />
            )}
        </>
    )
}

export default Completed
