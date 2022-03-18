"use babel"

import { actions, markdownRenderer } from "inkdrop"

import visit from "unist-util-visit"

const pkg = "color-highlighter"

const toggleCmd                    = `${pkg}:toggle`
const coloredTextModeCmd           = `${pkg}:colored-text-mode`
const coloredTextBackgroundModeCmd = `${pkg}:colored-text-background-mode`
const coloredBackgroundModeCmd     = `${pkg}:colored-background-mode`

const enabledCfg     = `${pkg}.enabled`
const displayModeCfg = `${pkg}.displayMode`

const coloredTextMode           = "Colored Text"
const coloredTextBackgroundMode = "Colored Text + Background"
const coloredBackgroundMode     = "Colored Background"

const colorCodeRegexp = /#[0-9a-fA-F]{6}/g

const highlighter = options => tree => {

    if (!inkdrop.config.get(enabledCfg)) {
        return
    }

    const displayMode = inkdrop.config.get(displayModeCfg)

    visit(tree, "text", node => {
        if (node.value.search(colorCodeRegexp) < 0) {
            return
        }

        node.type = "html"
        node.value = node.value.replace(
            colorCodeRegexp,
            match => {
                switch(displayMode) {
                    case coloredTextMode:
                        return `<span style="color: ${match};">${match}</span>`
                    case coloredTextBackgroundMode:
                        return `<span style="color: ${match}; background-color: var(--secondary-color); border-radius: 2px; padding-left: 3px; padding-right: 3px;">${match}</span>`
                    case coloredBackgroundMode:
                        return `<span style="background-color: ${match}; border-radius: 2px; padding-left: 3px; padding-right: 3px;">${match}</span>`
                    default:
                        return `ERROR: Unkown disaply mode: "${displayMode}"`
                }
            },
        )
    })

}

const triggerEditorUpdate = () => {
    inkdrop.store.dispatch(actions.editingNote.update({}))
}

module.exports = {

    config: {
        enabled: {
            title: "Enabled",
            description: "Quick toggle of color highlighter",
            type: "boolean",
            default: true
        },

        displayMode: {
            title: "Display mode",
            description: "How to display highlighted colors",
            type: "string",
            enum: [coloredTextMode, coloredTextBackgroundMode, coloredBackgroundMode],
            default: coloredTextMode
        }
    },

    activate() {
        if (!markdownRenderer) {
            return
        }

        inkdrop.commands.add(document.body, toggleCmd, e => {
            let enabled = inkdrop.config.get(enabledCfg)
            inkdrop.config.set(enabledCfg, !enabled)
        })

        inkdrop.commands.add(document.body, coloredTextModeCmd,           e => { inkdrop.config.set(displayModeCfg, coloredTextMode) })
        inkdrop.commands.add(document.body, coloredTextBackgroundModeCmd, e => { inkdrop.config.set(displayModeCfg, coloredTextBackgroundMode) })
        inkdrop.commands.add(document.body, coloredBackgroundModeCmd,     e => { inkdrop.config.set(displayModeCfg, coloredBackgroundMode) })

        inkdrop.config.observe(enabledCfg, isEnabled                    => { triggerEditorUpdate() })
        inkdrop.config.onDidChange(displayModeCfg, ({newMode, oldMode}) => { triggerEditorUpdate() }) 

        markdownRenderer.remarkPlugins.push(highlighter)
    },

    deactivate() {
        if (!markdownRenderer) {
            return
        }

        const { remarkPlugins } = markdownRenderer

        const i = remarkPlugins.indexOf(highlighter)
        if (i >= 0) {
            remarkPlugins.splice(i, 1)
        }

        inkdrop.store.dispatch(actions.editingNote.update({}))
    }

}

