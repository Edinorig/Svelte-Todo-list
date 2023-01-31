<script>
	import TodoItem from "./Components/TodoItem.svelte";

	let newTask = "";
	let tasksArray = [];
	let text = "checked";
	let idTasks = 0;

	const handlerDelete = (idx) => {
		let blockTask = document.querySelector(".wrapper-todo-block-" + idx);
		console.log(idx);
		tasksArray.forEach((task) => {
			if (task.idTasks === idx) {
				blockTask.parentNode.removeChild(blockTask);
				tasksArray.shift(idx);
				console.log(tasksArray);
			}
		});
	};

	const handlerFinish = (idx) => {
		tasksArray.forEach((task) => {
			if (task.idTasks === idx) {
				console.log("Finished");
				task.isDone = "checked";
				console.log(task);
			}
		});
	};

	function createTask() {
		newTask = document.querySelector(".newTask").value;
		if (!(newTask === "")) {
			const taskProps = {
				idTasks,
				isDone: "",
				remove: "",
				nameTask: document.querySelector(".newTask").value,
			};

			idTasks++;

			tasksArray = [...tasksArray, taskProps];
			console.log(tasksArray);
			newTask = document.querySelector(".newTask").value = "";
		} else {
			alert("Write something ");
		}
	}

	/* 	function checkName() {
		tasksArray.forEach(function (name) {
			console.log(name.nameTask);
			if (!(name.nameTask === newTask)) {
				console.log(name);
				return name;
			}
		});
	} */
</script>

<main>
	<div class="wrapper-create-task">
		<input
			type="text"
			class="newTask"
			value={newTask}
			placeholder="Write wour task here"
		/>
		<button on:click={createTask}>Create</button>
	</div>
	<div class="wrapper-container-tasks flex flex-justify-around">
		<div class="wrapper-todo">
			<h1>Todo</h1>
			{#each tasksArray as { idTasks, nameTask, isDone }}
				{#if !(isDone == "checked")}
					<TodoItem
						nameTodo={nameTask}
						idx={idTasks}
						{handlerDelete}
						{handlerFinish}
					/>
				{/if}
			{/each}
		</div>
		<div class="wrapper-done">
			<h1>Finished</h1>
			{#each tasksArray as { idTasks, isDone, nameTask }}
				{#if isDone == "checked"}
					<TodoItem
						nameTodo={nameTask}
						idx={idTasks}
						{handlerDelete}
						{handlerFinish}
					/>
				{/if}
			{/each}
		</div>
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
