<script lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { gitPull, gitBranch, gitBeginCommit, gitEndCommit, gitDiff, gitLog } from './git/git';
import { mkdir, copyFile, createPatchFileScm, createPatchFileDf } from './git/file';
const dayjs = require('dayjs');
export default {
	data() {
		return {
			type: ref('1'),
			dateRange: ref([]),
			beginCommit: ref(''),
			endCommit: ref(''),
			log: ref(''),
			btnDisabled: ref(false),

			form: reactive({
				type: '1',
				dateRange: [],
				beginCommit: '',
				endCommit: '',
				log: '',
				registoryPath: '',
				patchFile: false,
				btnDisabled: false
			})
		}
	},
	methods: {
		autoScroll() {
			const textarea: any = document.getElementById('textarea');
			textarea.scrollTop = textarea.scrollHeight;
		},
		beforeCheck() {
			if (this.form.type === '1') {
				if (this.form.dateRange.length !== 2) {
					ElMessage.warning('请录入日期期间');
					return false;
				}
			} else {
				if (!this.form.beginCommit.length || !this.form.endCommit.length) {
					ElMessage.warning('请录入commit期间');
					return false;
				}
			}
			return true;
		},
		async run() {
			this.form.log = '';
			if (!this.beforeCheck()) {
				return false;
			}
			this.form.btnDisabled = true;
			try {
				const branch = await gitBranch(this.form.registoryPath);
				this.form.log += `当前分支为 ${branch}\r\n开始拉取仓库...\r\n`;
				const pull = await gitPull(this.form.registoryPath);
				this.form.log += `${pull}\r\n`;
				this.autoScroll();
				let beginCommit = '';
				let endCommit = '';
				if (this.form.type === '1') {
					beginCommit = await gitBeginCommit(dayjs(this.form.dateRange[0]).format('YYYY-MM-DD HH:mm:ss'), this.form.registoryPath);
					endCommit = await gitEndCommit(dayjs(this.form.dateRange[1]).format('YYYY-MM-DD HH:mm:ss'), this.form.registoryPath);
				} else if (this.form.type === '2') {
					beginCommit = this.form.beginCommit;
					endCommit = this.form.endCommit;
				}
				this.form.log += `起始commit: ${beginCommit} (不包含)\r\n结束commit: ${endCommit} (包含)\r\n\r\n`;
				// 如果仓库路径最后一位是/,去除掉，避免生成文件路径不正常
				let rootPath = this.form.registoryPath;
				if (rootPath[rootPath.length - 1] === "/") {
					rootPath = rootPath.substring(0, rootPath.length - 1);
				}
				await mkdir('/patch', rootPath);
				const now = dayjs().format('YYYY-MM-DD-HH-mm-ss');
				this.form.log += `开始创建文件夹: ${rootPath}/patch/${now}\r\n\r\n`;
				await mkdir(`/patch/${now}`, rootPath);
				this.form.log += `开始获取增量...\r\n`;
				const zl = await gitDiff(beginCommit, endCommit, rootPath);
				this.form.log += `${zl}\r\n\r\n`;
				const files = zl.split('\n')
				if (!files.length) {
					this.form.log += '未获取到增量内容...提前结束';
					return false;
				}
				this.autoScroll();
				this.form.log += `生成增量文件...\r\n`
				const errMsg = await copyFile(files, `/patch/${now}`, rootPath);
				this.form.log += `${errMsg}\r\n增量文件生成完毕...\r\n\r\n`;
				await gitLog(beginCommit, endCommit, rootPath, now);
				this.form.log += `commit提交记录生成：${rootPath}/patch/${now}/log.xlsx\r\n\r\n`;
				this.autoScroll();
				if (this.form.patchFile) {
					this.form.log += `检测到需要生成补丁文件\r\n`;
					await createPatchFileScm(`${rootPath}/patch/${now}`);
					await createPatchFileDf(`${rootPath}/patch/${now}`);
					this.form.log += `补丁文件生成成功：${rootPath}/patch/${now}/scm补丁文件\r\n`;
					this.form.log += `补丁文件生成成功：${rootPath}/patch/${now}/df补丁文件\r\n\r\n`;
				}
				this.form.log += '结束...';
				this.autoScroll();
				this.form.btnDisabled = false;
			} catch (error) {
				this.form.log += '啊偶, 失败了';
				this.autoScroll();
				console.log(error);
				this.form.btnDisabled = false;
			}

		}
	}
}

</script>

<template>
	<div class="centerbox">
		<h2>供应链补丁增量工具</h2>
		<el-form :model="form" label-width="120px" style="width: 600px">
			<el-form-item label="ScmAll路径">
				<el-input v-model="form.registoryPath" />
			</el-form-item>
			<el-form-item label="获取方式">
				<el-radio-group v-model="form.type">
					<el-radio label="1">日期期间</el-radio>
					<el-radio label="2">commit期间</el-radio>
				</el-radio-group>
			</el-form-item>
			<el-form-item label="日期期间" v-show="form.type === '1'">
				<el-date-picker v-model="form.dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" />
			</el-form-item>
			<el-form-item label="commit期间" v-show="form.type === '2'">
				<el-col :span="11">
					<el-input v-model="form.beginCommit" placeholder="开始期间(不包含)" style="width: 100%" />
				</el-col>
				<el-col :span="2" class="text-center">
					<span class="text-gray-500">-</span>
				</el-col>
				<el-col :span="11">
					<el-input v-model="form.endCommit" placeholder="结束期间(包含)" style="width: 100%" />
				</el-col>
			</el-form-item>
			<el-form-item label="自动生成补丁">
				<el-switch v-model="form.patchFile" />
				<span v-if="form.patchFile" style="color: #e6a23c">&nbsp;请严格检查生成补丁内的文件和路径是否正确 !!!</span>
			</el-form-item>

			<el-form-item label="日志">
				<el-input id="textarea" v-model="form.log" type="textarea" :rows="2" :autosize="{ minRows: 15, maxRows: 15 }" resize="none" readonly />
			</el-form-item>
			<el-form-item>
				<el-button type="primary" size="large" @submit.prevent @click="run" :disabled="btnDisabled">执行</el-button>
			</el-form-item>
		</el-form>
	</div>
</template>

<style scoped>
h2 {
	font-weight: bold;
	text-align: center;
}
h3 {
	text-align: left;
}
.centerbox {
	width: 700px;
	height: 650px;
	border: 1px solid #ccc;
}
.options {
	display: flex;
	align-items: center;
	flex-direction: column;
}
.commit,
.path {
	width: 400px;
}

.log {
	margin-top: 8px;
	width: 400px;
}
.button {
	margin-top: 8px;
}
</style>
